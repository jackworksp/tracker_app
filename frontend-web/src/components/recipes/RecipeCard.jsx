import { Play, Instagram, Link as LinkIcon, BookOpen, Clock, Music2 } from 'lucide-react';
import { detectSource, getThumbnail, SOURCE_LABEL } from './recipeUtils';

const SOURCE_ICON = {
  youtube: Play,
  instagram: Instagram,
  tiktok: Music2,
  link: LinkIcon,
  written: BookOpen,
};

export default function RecipeCard({ recipe, onOpen }) {
  const source = recipe.source_type || detectSource(recipe.source_url);
  const Icon = SOURCE_ICON[source] || LinkIcon;
  const thumb = getThumbnail(recipe);

  return (
    <article
      className="recipe-card"
      onClick={() => onOpen?.(recipe)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen?.(recipe); }}
    >
      <div className="recipe-card__media">
        {thumb ? (
          <img src={thumb} alt="" className="recipe-card__thumb" loading="lazy" />
        ) : (
          <div className="recipe-card__thumb recipe-card__thumb--placeholder">
            <BookOpen size={32} strokeWidth={1.4} />
          </div>
        )}
        <span className={`recipe-card__badge recipe-card__badge--${source}`}>
          <Icon size={12} strokeWidth={2.2} />
          {SOURCE_LABEL[source]}
        </span>
      </div>

      <div className="recipe-card__body">
        <h3 className="recipe-card__title">{recipe.title}</h3>
        <div className="recipe-card__meta">
          {recipe.category && (
            <span className="recipe-card__pill">{recipe.category}</span>
          )}
          {recipe.cook_time_minutes ? (
            <span className="recipe-card__time">
              <Clock size={12} strokeWidth={2} />
              {recipe.cook_time_minutes} min
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
