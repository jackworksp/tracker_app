/**
 * Notion Design System - Exports
 * Import design system components with: import { Button, Card, ... } from './design-system'
 */

// Components
export { default as Button } from './components/Button/Button';
export { default as Input } from './components/Input/Input';
export { default as Select } from './components/Select/Select';
export { default as Card } from './components/Card/Card';
export { default as Modal } from './components/Modal/Modal';
export { default as Tooltip } from './components/Tooltip/Tooltip';
export { default as Divider } from './components/Divider/Divider';
export { default as Sidebar, SidebarItem, SidebarGroup } from './components/Sidebar/Sidebar';
export { default as Tabs, TabPane } from './components/Tabs/Tabs';

// Typography
export {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Paragraph,
  Caption,
  Label,
  Text,
} from './components/Typography/Typography';

// Styles - automatically imported
import './styles/variables.css';
import './styles/global.css';
