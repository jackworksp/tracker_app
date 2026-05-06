import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, ChefHat } from 'lucide-react';
import api from '../../api';
import VelaLogo from '../VelaLogo';
import RecipeCard from './RecipeCard';
import RecipeDetail from './RecipeDetail';
import AddRecipeModal from './AddRecipeModal';
import { SEED_CATEGORIES as BASE_CATEGORIES } from './recipeUtils';
import './recipes.css';

const SEED_CATEGORIES = ['All', ...BASE_CATEGORIES];

export default function RecipesPublicApp() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [extraCategories, setExtraCategories] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState(null);

  // Debounce the search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.recipes.list({
        category: activeCategory,
        q: debouncedQuery || undefined,
        limit: 100,
      });
      setRecipes(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, debouncedQuery]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Open Add modal from header button (and any future trigger)
  useEffect(() => {
    const open = () => setIsAddOpen(true);
    window.addEventListener('recipes:open-add', open);
    return () => window.removeEventListener('recipes:open-add', open);
  }, []);

  // Open detail when a card is clicked → push URL so it's shareable
  useEffect(() => {
    const onOpen = (e) => {
      const recipe = e.detail;
      if (!recipe?.id) return;
      setActiveRecipe(recipe);
      window.history.pushState({ recipeId: recipe.id }, '', `/vela/recipes/${recipe.id}`);
    };
    window.addEventListener('recipes:open-detail', onOpen);
    return () => window.removeEventListener('recipes:open-detail', onOpen);
  }, []);

  // Close detail → restore base URL
  const closeDetail = useCallback(() => {
    setActiveRecipe(null);
    if (window.location.pathname !== '/vela/recipes') {
      window.history.pushState({}, '', '/vela/recipes');
    }
  }, []);

  // Handle browser back/forward + initial deep link to /vela/recipes/:id
  useEffect(() => {
    const syncFromUrl = () => {
      const m = window.location.pathname.match(/\/recipes\/(\d+)/);
      if (m) {
        const id = m[1];
        api.recipes.get(id)
          .then((res) => setActiveRecipe(res.data))
          .catch(() => setActiveRecipe(null));
      } else {
        setActiveRecipe(null);
      }
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  // Pull custom categories that exist in DB but aren't in our seed list
  useEffect(() => {
    api.recipes.categories()
      .then(res => {
        const existing = new Set(SEED_CATEGORIES.map(c => c.toLowerCase()));
        const extras = (res.data || [])
          .map(r => r.category)
          .filter(c => c && !existing.has(c.toLowerCase()));
        setExtraCategories(extras);
      })
      .catch(() => {});
  }, [recipes.length]);

  const allCategories = [...SEED_CATEGORIES, ...extraCategories];

  return (
    <div className="recipes-public">
      <header className="recipes-header">
        <div className="recipes-header__brand">
          <VelaLogo size={28} />
          <span className="recipes-header__title">Recipes</span>
        </div>
        <a href="/vela/" className="recipes-header__home-link">Vela →</a>
      </header>

      <section className="recipes-hero">
        <div className="recipes-hero__inner">
          <h1 className="recipes-hero__heading">
            <ChefHat size={28} strokeWidth={1.6} />
            What are you cooking today?
          </h1>
          <div className="recipes-hero__actions">
            <div className="recipes-search">
              <Search size={18} className="recipes-search__icon" />
              <input
                type="text"
                placeholder="Search recipes, ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="recipes-search__input"
              />
            </div>
            <button
              className="recipes-add-btn"
              onClick={() => window.dispatchEvent(new CustomEvent('recipes:open-add'))}
            >
              <Plus size={18} />
              Add Recipe
            </button>
          </div>
        </div>
      </section>

      <nav className="recipes-chips" aria-label="Categories">
        {allCategories.map((cat) => (
          <button
            key={cat}
            className={`recipes-chip ${activeCategory === cat ? 'is-active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

      <main className="recipes-main">
        {loading && <div className="recipes-state">Loading recipes...</div>}
        {error && <div className="recipes-state recipes-state--error">{error}</div>}
        {!loading && !error && recipes.length === 0 && (
          <div className="recipes-empty">
            <ChefHat size={48} strokeWidth={1.2} />
            <p className="recipes-empty__title">No recipes yet</p>
            <p className="recipes-empty__hint">
              {activeCategory === 'All'
                ? 'Be the first to add one — paste a YouTube link or write your own.'
                : `No recipes in "${activeCategory}" yet.`}
            </p>
          </div>
        )}
        {!loading && !error && recipes.length > 0 && (
          <div className="recipes-grid">
            {recipes.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                onOpen={(rec) => window.dispatchEvent(new CustomEvent('recipes:open-detail', { detail: rec }))}
              />
            ))}
          </div>
        )}
      </main>

      <AddRecipeModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        knownCategories={extraCategories}
        onCreated={() => loadRecipes()}
      />

      {activeRecipe && (
        <RecipeDetail recipe={activeRecipe} onClose={closeDetail} />
      )}
    </div>
  );
}
