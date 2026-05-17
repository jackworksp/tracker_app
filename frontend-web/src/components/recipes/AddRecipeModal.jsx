import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Link as LinkIcon, PenLine, Loader2, Check, Plus } from 'lucide-react';
import api from '../../api';
import {
  detectSource,
  fetchYouTubeMeta,
  SEED_CATEGORIES,
  COOK_TIME_PRESETS,
} from './recipeUtils';

const TABS = [
  { id: 'link', label: 'Paste a link', Icon: LinkIcon },
  { id: 'write', label: 'Write from scratch', Icon: PenLine },
];

const EMPTY = {
  url: '',
  title: '',
  category: '',
  cookTime: null,
  description: '',
  ingredients: '',
  steps: '',
  thumbnail: '',
};

const MODAL_SPRING = { type: 'spring', damping: 26, stiffness: 300 };

export default function AddRecipeModal({ isOpen, onClose, onCreated, knownCategories = [] }) {
  const reduceMotion = useReducedMotion();
  const enterFrom = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 20 };
  const enterTo = reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 };
  const [tab, setTab] = useState('link');
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [error, setError] = useState(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const fetchSeqRef = useRef(0);

  const allCategories = Array.from(
    new Set([...SEED_CATEGORIES, ...knownCategories.filter(Boolean)])
  );

  useEffect(() => {
    if (!isOpen) {
      setTab('link');
      setForm(EMPTY);
      setAutoFilled(false);
      setError(null);
      setShowNewCategory(false);
      setNewCategory('');
    }
  }, [isOpen]);

  // Auto-fetch YouTube title + thumbnail when a YouTube URL is pasted
  useEffect(() => {
    const url = form.url.trim();
    if (tab !== 'link' || !url) return;
    const source = detectSource(url);
    if (source !== 'youtube') return;

    const seq = ++fetchSeqRef.current;
    setFetching(true);
    fetchYouTubeMeta(url).then((meta) => {
      if (seq !== fetchSeqRef.current) return; // outdated
      setFetching(false);
      if (meta) {
        setForm((f) => ({
          ...f,
          title: f.title || meta.title || '',
          thumbnail: f.thumbnail || meta.thumbnail || '',
        }));
        setAutoFilled(true);
      }
    });
  }, [form.url, tab]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const finalCategory = (showNewCategory ? newCategory : form.category).trim() || null;

    if (tab === 'link') {
      if (!form.url.trim()) return setError('Please paste a URL.');
    }
    if (!form.title.trim()) {
      return setError('Please give the recipe a title.');
    }

    const source_type = tab === 'write' ? 'written' : detectSource(form.url);

    const payload = {
      title: form.title.trim(),
      category: finalCategory,
      source_type,
      source_url: tab === 'write' ? null : form.url.trim() || null,
      thumbnail_url: form.thumbnail || null,
      description: form.description.trim() || null,
      ingredients: form.ingredients.trim() || null,
      steps: form.steps.trim() || null,
      cook_time_minutes: form.cookTime || null,
    };

    try {
      setSubmitting(true);
      const res = await api.recipes.create(payload);
      onCreated?.(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save recipe.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="recipe-modal__backdrop"
        onClick={onClose}
      />
      <motion.div
        initial={enterFrom}
        animate={enterTo}
        exit={enterFrom}
        transition={reduceMotion ? { duration: 0.12 } : MODAL_SPRING}
        className="recipe-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="recipe-modal__header">
          <h2>Add a recipe</h2>
          <button className="recipe-modal__close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="recipe-modal__tabs" role="tablist">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              className={`recipe-modal__tab ${tab === id ? 'is-active' : ''}`}
              onClick={() => setTab(id)}
              type="button"
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="recipe-modal__form">
          {tab === 'link' && (
            <div className="recipe-field">
              <label htmlFor="rcp-url">Paste a YouTube, Instagram, or web link</label>
              <div className="recipe-input-with-status">
                <input
                  id="rcp-url"
                  type="url"
                  inputMode="url"
                  value={form.url}
                  onChange={(e) => { setField('url', e.target.value); setAutoFilled(false); }}
                  placeholder="https://youtu.be/..."
                  className="recipe-input"
                  autoFocus
                />
                {fetching && <Loader2 size={16} className="recipe-spinner" />}
                {autoFilled && !fetching && (
                  <span className="recipe-input__hint"><Check size={14} /> auto-filled</span>
                )}
              </div>
            </div>
          )}

          <div className="recipe-field">
            <label htmlFor="rcp-title">Title <span className="recipe-required">*</span></label>
            <input
              id="rcp-title"
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="e.g. 15-minute Garlic Pasta"
              className="recipe-input"
              autoFocus={tab === 'write'}
              required
            />
          </div>

          <div className="recipe-field">
            <label>Category</label>
            {!showNewCategory ? (
              <div className="recipe-category-grid">
                {allCategories.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    className={`recipe-pick ${form.category === cat ? 'is-active' : ''}`}
                    onClick={() => setField('category', form.category === cat ? '' : cat)}
                  >
                    {cat}
                  </button>
                ))}
                <button
                  type="button"
                  className="recipe-pick recipe-pick--add"
                  onClick={() => setShowNewCategory(true)}
                >
                  <Plus size={12} /> New
                </button>
              </div>
            ) : (
              <div className="recipe-input-row">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category name"
                  className="recipe-input"
                  autoFocus
                />
                <button
                  type="button"
                  className="recipe-btn recipe-btn--ghost"
                  onClick={() => { setShowNewCategory(false); setNewCategory(''); }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="recipe-field">
            <label>Cook time</label>
            <div className="recipe-category-grid">
              {COOK_TIME_PRESETS.map((min) => (
                <button
                  type="button"
                  key={min}
                  className={`recipe-pick ${form.cookTime === min ? 'is-active' : ''}`}
                  onClick={() => setField('cookTime', form.cookTime === min ? null : min)}
                >
                  {min} min
                </button>
              ))}
            </div>
          </div>

          {tab === 'write' && (
            <>
              <div className="recipe-field">
                <label htmlFor="rcp-ing">Ingredients (one per line)</label>
                <textarea
                  id="rcp-ing"
                  value={form.ingredients}
                  onChange={(e) => setField('ingredients', e.target.value)}
                  placeholder={'2 cloves garlic\n200g spaghetti\nOlive oil'}
                  className="recipe-input recipe-textarea"
                  rows={5}
                />
              </div>
              <div className="recipe-field">
                <label htmlFor="rcp-steps">Steps (one per line)</label>
                <textarea
                  id="rcp-steps"
                  value={form.steps}
                  onChange={(e) => setField('steps', e.target.value)}
                  placeholder={'Boil pasta\nSauté garlic in olive oil\nToss & serve'}
                  className="recipe-input recipe-textarea"
                  rows={6}
                />
              </div>
            </>
          )}

          {tab === 'link' && (
            <details className="recipe-details">
              <summary>Add ingredients & steps now (optional)</summary>
              <div className="recipe-field">
                <label htmlFor="rcp-ing-l">Ingredients (one per line)</label>
                <textarea
                  id="rcp-ing-l"
                  value={form.ingredients}
                  onChange={(e) => setField('ingredients', e.target.value)}
                  className="recipe-input recipe-textarea"
                  rows={3}
                />
              </div>
              <div className="recipe-field">
                <label htmlFor="rcp-steps-l">Steps (one per line)</label>
                <textarea
                  id="rcp-steps-l"
                  value={form.steps}
                  onChange={(e) => setField('steps', e.target.value)}
                  className="recipe-input recipe-textarea"
                  rows={4}
                />
              </div>
            </details>
          )}

          {error && <div className="recipe-modal__error">{error}</div>}

          <footer className="recipe-modal__footer">
            <button
              type="button"
              className="recipe-btn recipe-btn--ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="recipe-btn recipe-btn--primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save recipe'}
            </button>
          </footer>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
