import React from 'react';
import PropTypes from 'prop-types';
import './Button.css';

/**
 * Button Component
 * 
 * A flexible button component with multiple variants and states.
 * Follows Notion's minimalist design principles.
 * 
 * @component
 * @example
 * ```jsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
const Button = ({
  children,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon = null,
  rightIcon = null,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseClass = 'nds-button';
  const variantClass = `${baseClass}--${variant}`;
  const sizeClass = `${baseClass}--${size}`;
  const fullWidthClass = fullWidth ? `${baseClass}--full-width` : '';
  const loadingClass = loading ? `${baseClass}--loading` : '';
  const disabledClass = disabled ? `${baseClass}--disabled` : '';

  const classNames = [
    baseClass,
    variantClass,
    sizeClass,
    fullWidthClass,
    loadingClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <button
      type={type}
      className={classNames}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span className={`${baseClass}__spinner`} aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none">
            <circle
              cx="8"
              cy="8"
              r="7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="32"
              strokeDashoffset="32"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="32;0"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </span>
      )}
      {leftIcon && !loading && (
        <span className={`${baseClass}__icon ${baseClass}__icon--left`}>
          {leftIcon}
        </span>
      )}
      <span className={`${baseClass}__content`}>
        {children}
      </span>
      {rightIcon && !loading && (
        <span className={`${baseClass}__icon ${baseClass}__icon--right`}>
          {rightIcon}
        </span>
      )}
    </button>
  );
};

Button.propTypes = {
  /** Button content */
  children: PropTypes.node.isRequired,
  /** Visual style variant */
  variant: PropTypes.oneOf(['default', 'primary', 'outline', 'subtle', 'danger']),
  /** Button size */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Make button full width */
  fullWidth: PropTypes.bool,
  /** Disable button */
  disabled: PropTypes.bool,
  /** Show loading state */
  loading: PropTypes.bool,
  /** Icon to show on left side */
  leftIcon: PropTypes.node,
  /** Icon to show on right side */
  rightIcon: PropTypes.node,
  /** Click handler */
  onClick: PropTypes.func,
  /** Button type attribute */
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default Button;
