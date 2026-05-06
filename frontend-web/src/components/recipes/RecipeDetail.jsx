import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Clock, Users, Share2, Check } from 'lucide-react';
import { detectSource, getYouTubeId, getThumbnail, SOURCE_LABEL } from './recipeUtils';

const splitLines = (text) =>
  (text || '')
    .split('\n')
    .map((line) => line.replace(/^[-*•\d.\s]+/, '').trim())
    .filter(Boolean);

const STORAGE_KEY = (id) => `recipe:${id}:checked`;

export default function RecipeDetail({ recipe, onClose }) {
  const [checked, setChecked] = useState(new Set());
  const [shareCopied, setShareCopied] = useState(false);

  const ingredients = useMemo(() => splitLines(recipe?.ingredients), [recipe]);
  const steps = useMemo(() => splitLines(recipe?.steps), [recipe]);
  const source = recipe?.source_type || detectSource(recipe?.source_url);
  const youtubeId = getYouTubeId(recipe?.source_url);
  const heroImage = !youtubeId ? getThumbnail(recipe || {}) : null;

  // Restore checked ingredients per recipe (localStorage, no auth needed)
  useEffect(() => {
    if (!recipe?.id) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY(recipe.id));
      if (raw) setChecked(new Set(JSON.parse(raw)));
      else setChecked(new Set());
    } catch {
      setChecked(new Set());
    }
  }, [recipe?.id]);

  // Esc to close
  useEffect(() => {
    if (!recipe) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [recipe, onClose]);

  const toggleIngredient = (idx) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      try {
        localStorage.setItem(STORAGE_KEY(recipe.id), JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/vela/recipes/${recipe.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: recipe.title, url });
        return;
      } catch { /* fall through to copy */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
    } catch {}
  };

  if (!recipe) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="recipe-detail__backdrop"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="recipe-detail"
        role="dialog"
        aria-label={recipe.title}
      >
        <button className="recipe-detail__close" onClick={onClose} aria-label="Close">
          <X size={22} />
        </button>

        <div className="recipe-detail__media">
          {youtubeId ? (
            <iframe
              className="recipe-detail__embed"
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={recipe.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : heroImage ? (
            <img src={heroImage} alt="" className="recipe-detail__hero" />
          ) : (
            <div className="recipe-detail__hero recipe-detail__hero--blank" />
          )}
        </div>

        <div className="recipe-detail__body">
          <div className="recipe-detail__heading">
            <div>
              <h1 className="recipe-detail__title">{recipe.title}</h1>
              <div className="recipe-detail__meta">
                {recipe.category && <span className="recipe-detail__chip">{recipe.category}</span>}
                {recipe.cook_time_minutes && (
                  <span className="recipe-detail__metaitem">
                    <Clock size={14} /> {recipe.cook_time_minutes} min
                  </span>
                )}
                {recipe.servings && (
                  <span className="recipe-detail__metaitem">
                    <Users size={14} /> Serves {recipe.servings}
                  </span>
                )}
                {source && source !== 'written' && (
                  <span className="recipe-detail__metaitem">via {SOURCE_LABEL[source]}</span>
                )}
              </div>
            </div>
            <div className="recipe-detail__actions">
              <button className="recipe-detail__iconbtn" onClick={handleShare} title="Share">
                {shareCopied ? <Check size={16} /> : <Share2 size={16} />}
                <span>{shareCopied ? 'Copied' : 'Share'}</span>
              </button>
              {recipe.source_url && (
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="recipe-detail__iconbtn"
                >
                  <ExternalLink size={16} />
                  <span>Source</span>
                </a>
              )}
            </div>
          </div>

          {recipe.description && (
            <p className="recipe-detail__desc">{recipe.description}</p>
          )}

          <div className="recipe-detail__columns">
            {ingredients.length > 0 && (
              <section className="recipe-detail__col">
                <h2 className="recipe-detail__h2">Ingredients</h2>
                <ul className="recipe-detail__ingredients">
                  {ingredients.map((line, idx) => (
                    <li
                      key={idx}
                      className={`recipe-detail__ing ${checked.has(idx) ? 'is-checked' : ''}`}
                      onClick={() => toggleIngredient(idx)}
                    >
                      <span className="recipe-detail__check">
                        {checked.has(idx) && <Check size={14} strokeWidth={3} />}
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {steps.length > 0 && (
              <section className="recipe-detail__col recipe-detail__col--steps">
                <h2 className="recipe-detail__h2">Steps</h2>
                <ol className="recipe-detail__steps">
                  {steps.map((step, idx) => (
                    <li key={idx} className="recipe-detail__step">
                      <span className="recipe-detail__stepnum">{idx + 1}</span>
                      <span className="recipe-detail__steptext">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          {ingredients.length === 0 && steps.length === 0 && (
            <div className="recipe-detail__empty">
              <p>This recipe doesn't have written ingredients or steps yet.</p>
              {recipe.source_url && (
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="recipe-btn recipe-btn--primary"
                >
                  Open original <ExternalLink size={14} />
                </a>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
