import React from 'react';
import './Badge.css';

/**
 * Badge / Chip component for tags, labels, and status indicators.
 *
 * Usage:
 *   <Badge>default</Badge>
 *   <Badge variant="success">Completed</Badge>
 *   <Badge variant="brand" removable onRemove={() => {}}>tag</Badge>
 */
const Badge = ({
  children,
  variant = 'default',
  size = 'sm',
  removable = false,
  onRemove,
  onClick,
  active = false,
  className = '',
  ...rest
}) => {
  const classes = [
    'nds-badge',
    `nds-badge--${variant}`,
    `nds-badge--${size}`,
    active ? 'nds-badge--active' : '',
    onClick ? 'nds-badge--clickable' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } } : undefined}
      {...rest}
    >
      {children}
      {removable && (
        <button
          type="button"
          className="nds-badge-remove"
          onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  );
};

export default Badge;
