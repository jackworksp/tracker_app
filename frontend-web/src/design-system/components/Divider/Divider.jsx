import React from 'react';
import PropTypes from 'prop-types';
import './Divider.css';

/**
 * Divider/Separator Component
 * 
 * A simple divider to separate content sections.
 * 
 * @component
 * @example
 * ```jsx
 * <Divider />
 * <Divider orientation="vertical" />
 * <Divider label="OR" />
 * ```
 */
const Divider = ({
  orientation = 'horizontal',
  spacing = 'md',
  label,
  className = '',
  ...props
}) => {
  const baseClass = 'nds-divider';
  
  const classNames = [
    baseClass,
    `${baseClass}--${orientation}`,
    `${baseClass}--spacing-${spacing}`,
    label ? `${baseClass}--with-label` : '',
    className
  ].filter(Boolean).join(' ');

  if (label) {
    return (
      <div className={classNames} role="separator" {...props}>
        <span className={`${baseClass}__line`} />
        <span className={`${baseClass}__label`}>{label}</span>
        <span className={`${baseClass}__line`} />
      </div>
    );
  }

  return (
    <hr className={classNames} role="separator" {...props} />
  );
};

Divider.propTypes = {
  /** Divider orientation */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /** Spacing around divider */
  spacing: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
  /** Optional label */
  label: PropTypes.string,
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default Divider;
