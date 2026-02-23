/**
 * OAuth 2.0 Authorization Code + PKCE server for Claude.ai connector integration.
 * Endpoints:
 *   GET  /vela/oauth/authorize  — show login form
 *   POST /vela/oauth/authorize  — process login, redirect with code
 *   POST /vela/oauth/token      — exchange code for JWT access token
 */

const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// In-memory code store: code -> { userId, redirectUri, codeChallenge, codeChallengeMethod, expiresAt }
const authCodes = new Map();

// Clean up expired codes every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [code, data] of authCodes) {
        if (data.expiresAt < now) authCodes.delete(code);
    }
}, 5 * 60 * 1000);

// GET /vela/oauth/authorize — show login form
router.get('/authorize', (req, res) => {
    const { client_id, redirect_uri, state, code_challenge, code_challenge_method, response_type } = req.query;

    if (!redirect_uri) return res.status(400).send('Missing redirect_uri');

    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Authorize Vela</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 400px; margin: 80px auto; padding: 0 20px; }
    h2 { margin-bottom: 8px; }
    p { color: #666; margin-bottom: 24px; font-size: 14px; }
    label { display: block; margin-bottom: 4px; font-size: 14px; font-weight: 500; }
    input[type=email], input[type=password] {
      width: 100%; padding: 10px 12px; margin-bottom: 16px; border: 1px solid #ddd;
      border-radius: 6px; font-size: 15px; box-sizing: border-box;
    }
    button { width: 100%; padding: 11px; background: #6c47ff; color: white; border: none;
      border-radius: 6px; font-size: 15px; font-weight: 500; cursor: pointer; }
    button:hover { background: #5a38e0; }
    .error { color: #dc2626; font-size: 14px; margin-bottom: 12px; }
  </style>
</head>
<body>
  <h2>Connect Vela to Claude</h2>
  <p>Sign in to authorize Claude to access your Vela study data.</p>
  <form method="POST" action="/vela/oauth/authorize">
    <input type="hidden" name="client_id" value="${client_id || ''}">
    <input type="hidden" name="redirect_uri" value="${redirect_uri}">
    <input type="hidden" name="state" value="${state || ''}">
    <input type="hidden" name="code_challenge" value="${code_challenge || ''}">
    <input type="hidden" name="code_challenge_method" value="${code_challenge_method || ''}">
    <label>Email</label>
    <input type="email" name="email" required autofocus>
    <label>Password</label>
    <input type="password" name="password" required>
    <button type="submit">Authorize</button>
  </form>
</body>
</html>`);
});

// POST /vela/oauth/authorize — validate login, issue code, redirect
router.post('/authorize', express.urlencoded({ extended: true }), async (req, res) => {
    const { email, password, client_id, redirect_uri, state, code_challenge, code_challenge_method } = req.body;

    if (!redirect_uri) return res.status(400).send('Missing redirect_uri');

    const db = require('../database');
    try {
        const result = await db.pool.query(
            'SELECT id, user_id, password_hash FROM user_settings WHERE user_id = $1',
            [email.trim().toLowerCase()]
        );

        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Authorize Vela</title>
<style>body{font-family:system-ui,sans-serif;max-width:400px;margin:80px auto;padding:0 20px}
label{display:block;margin-bottom:4px;font-size:14px;font-weight:500}
input{width:100%;padding:10px 12px;margin-bottom:16px;border:1px solid #ddd;border-radius:6px;font-size:15px;box-sizing:border-box}
button{width:100%;padding:11px;background:#6c47ff;color:white;border:none;border-radius:6px;font-size:15px;font-weight:500;cursor:pointer}
.error{color:#dc2626;font-size:14px;margin-bottom:12px}</style></head>
<body><h2>Connect Vela to Claude</h2>
<div class="error">Invalid email or password.</div>
<form method="POST" action="/vela/oauth/authorize">
<input type="hidden" name="client_id" value="${client_id || ''}">
<input type="hidden" name="redirect_uri" value="${redirect_uri}">
<input type="hidden" name="state" value="${state || ''}">
<input type="hidden" name="code_challenge" value="${code_challenge || ''}">
<input type="hidden" name="code_challenge_method" value="${code_challenge_method || ''}">
<label>Email</label><input type="email" name="email" required autofocus>
<label>Password</label><input type="password" name="password" required>
<button type="submit">Authorize</button></form></body></html>`);
        }

        // Generate auth code
        const code = crypto.randomBytes(32).toString('hex');
        authCodes.set(code, {
            userId: user.id,
            redirectUri: redirect_uri,
            codeChallenge: code_challenge || null,
            codeChallengeMethod: code_challenge_method || null,
            expiresAt: Date.now() + 10 * 60 * 1000
        });

        const redirectUrl = new URL(redirect_uri);
        redirectUrl.searchParams.set('code', code);
        if (state) redirectUrl.searchParams.set('state', state);
        res.redirect(redirectUrl.toString());

    } catch (err) {
        console.error('OAuth authorize error:', err);
        res.status(500).send('Internal server error');
    }
});

// POST /vela/oauth/token — exchange code for access token
router.post('/token', express.urlencoded({ extended: true }), express.json(), async (req, res) => {
    const { grant_type, code, redirect_uri, code_verifier } = req.body;

    if (grant_type !== 'authorization_code') {
        return res.status(400).json({ error: 'unsupported_grant_type' });
    }

    const codeData = authCodes.get(code);
    if (!codeData || codeData.expiresAt < Date.now()) {
        return res.status(400).json({ error: 'invalid_grant', error_description: 'Code expired or invalid' });
    }

    // PKCE validation
    if (codeData.codeChallenge && code_verifier) {
        const challenge = crypto.createHash('sha256').update(code_verifier).digest('base64url');
        if (challenge !== codeData.codeChallenge) {
            return res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE verification failed' });
        }
    }

    authCodes.delete(code);

    const token = jwt.sign({ userId: codeData.userId }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', { expiresIn: '90d' });

    res.json({
        access_token: token,
        token_type: 'bearer',
        expires_in: 90 * 24 * 60 * 60
    });
});

module.exports = router;
