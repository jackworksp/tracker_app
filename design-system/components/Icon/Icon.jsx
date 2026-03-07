import React from 'react';
import './Icon.css';

/**
 * Icon wrapper for consistent sizing, color, and accessibility.
 *
 * Usage:
 *   import { Icon, IconSearch } from '@design-system';
 *   <Icon icon={IconSearch} size="md" color="secondary" />
 *
 * Or pass any lucide icon directly:
 *   import { Search } from '@design-system';
 *   <Icon icon={Search} />
 */

const SIZE_MAP = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
};

const Icon = ({
  icon: IconComponent,
  size = 'md',
  color,
  className = '',
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  style,
  ...rest
}) => {
  if (!IconComponent) return null;

  const px = typeof size === 'number' ? size : SIZE_MAP[size] ?? 16;
  const colorClass = color ? `nds-icon--${color}` : '';
  const hidden = ariaHidden !== undefined ? ariaHidden : !ariaLabel;

  return (
    <IconComponent
      size={px}
      className={`nds-icon ${colorClass} ${className}`.trim()}
      aria-label={ariaLabel}
      aria-hidden={hidden}
      style={style}
      {...rest}
    />
  );
};

export default Icon;
