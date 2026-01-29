import React from 'react';
import PropTypes from 'prop-types';
import './Typography.css';

/**
 * Typography Components
 * 
 * A set of text components following Notion's typography system.
 */

const createTypographyComponent = (tag, baseClass) => {
  const Component = ({ 
    children, 
    className = '', 
    color = 'primary',
    weight,
    align,
    ...props 
  }) => {
    const Element = tag;
    const classes = [
      baseClass,
      color ? `nds-text--${color}` : '',
      weight ? `nds-text--weight-${weight}` : '',
      align ? `nds-text--align-${align}` : '',
      className
    ].filter(Boolean).join(' ');

    return <Element className={classes} {...props}>{children}</Element>;
  };

  Component.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    color: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'inverse', 'link']),
    weight: PropTypes.oneOf(['normal', 'medium', 'semibold', 'bold']),
    align: PropTypes.oneOf(['left', 'center', 'right']),
  };

  return Component;
};

export const H1 = createTypographyComponent('h1', 'nds-h1');
export const H2 = createTypographyComponent('h2', 'nds-h2');
export const H3 = createTypographyComponent('h3', 'nds-h3');
export const H4 = createTypographyComponent('h4', 'nds-h4');
export const H5 = createTypographyComponent('h5', 'nds-h5');
export const H6 = createTypographyComponent('h6', 'nds-h6');
export const Paragraph = createTypographyComponent('p', 'nds-paragraph');
export const Caption = createTypographyComponent('span', 'nds-caption');
export const Label = createTypographyComponent('label', 'nds-label');

/**
 * Generic Text component
 */
export const Text = ({ 
  children, 
  as = 'span',
  size = 'base',
  className = '',
  color = 'primary',
  weight = 'normal',
  align,
  truncate = false,
  ...props 
}) => {
  const Element = as;
  const classes = [
    'nds-text',
    `nds-text--size-${size}`,
    `nds-text--${color}`,
    `nds-text--weight-${weight}`,
    align ? `nds-text--align-${align}` : '',
    truncate ? 'nds-truncate' : '',
    className
  ].filter(Boolean).join(' ');

  return <Element className={classes} {...props}>{children}</Element>;
};

Text.propTypes = {
  children: PropTypes.node.isRequired,
  as: PropTypes.string,
  size: PropTypes.oneOf(['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl']),
  className: PropTypes.string,
  color: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'inverse', 'link']),
  weight: PropTypes.oneOf(['normal', 'medium', 'semibold', 'bold']),
  align: PropTypes.oneOf(['left', 'center', 'right']),
  truncate: PropTypes.bool,
};

export default {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Paragraph,
  Caption,
  Label,
  Text
};
