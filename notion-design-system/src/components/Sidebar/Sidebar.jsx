import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './Sidebar.css';

/**
 * Sidebar/Navigation Component
 * 
 * A collapsible sidebar navigation following Notion's design.
 * 
 * @component
 * @example
 * ```jsx
 * <Sidebar
 *   header={<Logo />}
 *   footer={<UserMenu />}
 * >
 *   <SidebarItem icon={<Icon />} label="Dashboard" active />
 *   <SidebarItem icon={<Icon />} label="Settings" />
 * </Sidebar>
 * ```
 */
const Sidebar = ({
  children,
  header,
  footer,
  collapsed = false,
  onToggle,
  width = '240px',
  collapsedWidth = '60px',
  className = '',
  ...props
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onToggle?.(newState);
  };

  const baseClass = 'nds-sidebar';
  const classNames = [
    baseClass,
    isCollapsed ? `${baseClass}--collapsed` : '',
    className
  ].filter(Boolean).join(' ');

  const style = {
    '--sidebar-width': width,
    '--sidebar-collapsed-width': collapsedWidth,
  };

  return (
    <aside className={classNames} style={style} {...props}>
      {header && (
        <div className={`${baseClass}__header`}>
          {header}
        </div>
      )}

      <nav className={`${baseClass}__content`}>
        {children}
      </nav>

      {footer && (
        <div className={`${baseClass}__footer`}>
          {footer}
        </div>
      )}

      <button
        type="button"
        className={`${baseClass}__toggle`}
        onClick={handleToggle}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d={isCollapsed ? "M6 4L10 8L6 12" : "M10 4L6 8L10 12"}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </aside>
  );
};

/**
 * SidebarItem Component
 * 
 * Individual navigation item for the Sidebar.
 */
export const SidebarItem = ({
  icon,
  label,
  active = false,
  onClick,
  badge,
  children,
  className = '',
  ...props
}) => {
  const baseClass = 'nds-sidebar-item';
  const classNames = [
    baseClass,
    active ? `${baseClass}--active` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classNames}
      onClick={onClick}
      {...props}
    >
      {icon && (
        <span className={`${baseClass}__icon`}>
          {icon}
        </span>
      )}
      <span className={`${baseClass}__label`}>
        {label}
      </span>
      {badge && (
        <span className={`${baseClass}__badge`}>
          {badge}
        </span>
      )}
      {children}
    </button>
  );
};

/**
 * SidebarGroup Component
 * 
 * Group of sidebar items with optional title.
 */
export const SidebarGroup = ({
  title,
  children,
  className = '',
}) => {
  const baseClass = 'nds-sidebar-group';
  
  return (
    <div className={`${baseClass} ${className}`}>
      {title && (
        <div className={`${baseClass}__title`}>
          {title}
        </div>
      )}
      <div className={`${baseClass}__items`}>
        {children}
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  children: PropTypes.node,
  header: PropTypes.node,
  footer: PropTypes.node,
  collapsed: PropTypes.bool,
  onToggle: PropTypes.func,
  width: PropTypes.string,
  collapsedWidth: PropTypes.string,
  className: PropTypes.string,
};

SidebarItem.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func,
  badge: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
};

SidebarGroup.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
};

export default Sidebar;
