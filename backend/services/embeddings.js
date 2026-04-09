const { pool } = require('../database');

const GEMINI_EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMS = 768;

/**
 * Calls Gemini Embedding API and returns a float array of length 768.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function embedText(text) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${process.env.GEMINI_API_KEY}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: { parts: [{ text: text.slice(0, 10000) }] },
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini embedding failed: ${err}`);
    }

    const data = await res.json();
    return data.embedding.values; // float[]
}

/**
 * Embeds a document and upserts it into document_embeddings.
 * Fire-and-forget safe — errors are thrown for caller to handle.
 *
 * @param {number} userId - user_settings.id
 * @param {string} sourceTable - 'notes' | 'tasks' | 'study_sessions' | 'goals'
 * @param {number} sourceId
 * @param {string} text - the text to embed
 */
async function upsertEmbedding(userId, sourceTable, sourceId, text) {
    if (!text || text.trim().length < 5) return;

    const vector = await embedText(text);
    const vectorStr = `[${vector.join(',')}]`;

    await pool.query(
        `INSERT INTO document_embeddings (user_id, source_table, source_id, chunk_text, embedding, updated_at)
         VALUES ($1, $2, $3, $4, $5::vector, NOW())
         ON CONFLICT (source_table, source_id, user_id)
         DO UPDATE SET chunk_text = EXCLUDED.chunk_text,
                       embedding = EXCLUDED.embedding,
                       updated_at = NOW()`,
        [userId, sourceTable, sourceId, text.slice(0, 2000), vectorStr]
    );
}

/**
 * Embeds the query and returns the top-K most similar documents for the user.
 *
 * @param {number} userId - user_settings.id
 * @param {string} queryText
 * @param {number} limit
 * @returns {Promise<Array<{source_table, source_id, chunk_text, similarity}>>}
 */
async function searchSimilar(userId, queryText, limit = 8) {
    const vector = await embedText(queryText);
    const vectorStr = `[${vector.join(',')}]`;

    const result = await pool.query(
        `SELECT source_table, source_id, chunk_text,
                1 - (embedding <=> $1::vector) AS similarity
         FROM document_embeddings
         WHERE user_id = $2
         ORDER BY embedding <=> $1::vector
         LIMIT $3`,
        [vectorStr, userId, limit]
    );

    return result.rows;
}

module.exports = { embedText, upsertEmbedding, searchSimilar };
