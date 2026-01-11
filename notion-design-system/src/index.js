/**
 * Notion Design System
 * A complete design system inspired by Notion's UI principles
 * 
 * @package notion-design-system
 * @version 1.0.0
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

// Typography components
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
  default as Typography
} from './components/Typography/Typography';

// Tokens
export { default as tokens } from './tokens/tokens.json';

// Styles (import these in your app)
import './styles/variables.css';
import './styles/global.css';
