import React from 'react';
import './Tabs.css';

/**
 * Simple Tabs Component for Study Tracker
 * Replaces Ant Design Tabs with design system styling
 */
export const Tabs = ({ activeKey, onChange, children, size = 'large', className = '' }) => {
  const items = React.Children.toArray(children);

  return (
    <div className={`nds-tabs ${className}`}>
      <div className={`nds-tabs__nav nds-tabs__nav--${size}`}>
        {items.map((child) => {
          const isActive = child.props.tabKey === activeKey;
          return (
            <button
              key={child.props.tabKey}
              className={`nds-tab ${isActive ? 'nds-tab--active' : ''}`}
              onClick={() => onChange(child.props.tabKey)}
              type="button"
            >
              {child.props.tab}
            </button>
          );
        })}
      </div>
      <div className="nds-tabs__content">
        {items.find((child) => child.props.tabKey === activeKey)?.props.children}
      </div>
    </div>
  );
};

export const TabPane = ({ children }) => {
  return <>{children}</>;
};

Tabs.TabPane = TabPane;

export default Tabs;
