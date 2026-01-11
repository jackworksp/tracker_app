import React from 'react';
import PropTypes from 'prop-types';
import './Card.css';

/**
 * Card Component
 * 
 * A flexible container component following Notion's block-based design.
 * 
 * @component
 * @example
 * ```jsx
 * <Card padding="md" shadow="sm" hoverable>
 *   <h3>Card Title</h3>
 *   <p>Card content goes here</p>
 * </Card>
 * ```
 */
const Card = ({
  children,
  padding = 'md',
  shadow = 'sm',
  border = true,
  hoverable = false,
  interactive = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseClass = 'nds-card';
  
  const classNames = [
    baseClass,
    `${baseClass}--padding-${padding}`,
    `${baseClass}--shadow-${shadow}`,
    border ? `${baseClass}--border` : '',
    hoverable ? `${baseClass}--hoverable` : '',
    interactive ? `${baseClass}--interactive` : '',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (interactive || onClick) {
      onClick?.(e);
    }
  };

  const CardElement = interactive ? 'button' : 'div';

  return (
    <CardElement
      className={classNames}
      onClick={handleClick}
      type={interactive ? 'button' : undefined}
      {...props}
    >
      {children}
    </CardElement>
  );
};

Card.propTypes = {
  /** Card content */
  children: PropTypes.node.isRequired,
  /** Padding size */
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl']),
  /** Shadow depth */
  shadow: PropTypes.oneOf(['none', 'xs', 'sm', 'md', 'lg']),
  /** Show border */
  border: PropTypes.bool,
  /** Add hover effect */
  hoverable: PropTypes.bool,
  /** Make card interactive (button) */
  interactive: PropTypes.bool,
  /** Click handler */
  onClick: PropTypes.func,
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default Card;
