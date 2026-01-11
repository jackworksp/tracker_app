import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Card,
  Modal,
  Tooltip,
  Divider,
  Sidebar,
  SidebarItem,
  SidebarGroup,
  H1,
  H2,
  H3,
  H4,
  Paragraph,
  Text,
} from '../src/index';

import '../src/styles/variables.css';
import '../src/styles/global.css';
import './StyleGuide.css';

/**
 * Style Guide & Example Page
 * Demonstrates all components and design tokens
 */
function StyleGuide() {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  return (
    <div className="style-guide">
      {/* Sidebar Example */}
      <Sidebar
        header={
          <div style={{ padding: '8px 0' }}>
            <H3>Design System</H3>
          </div>
        }
        footer={
          <div>
            <Text size="xs" color="tertiary">v1.0.0</Text>
          </div>
        }
      >
        <SidebarGroup title="Components">
          <SidebarItem icon={<span>📝</span>} label="Typography" active />
          <SidebarItem icon={<span>🎨</span>} label="Colors" />
          <SidebarItem icon={<span>🔘</span>} label="Buttons" />
          <SidebarItem icon={<span>📥</span>} label="Inputs" badge="4" />
        </SidebarGroup>
        <SidebarGroup title="Tokens">
          <SidebarItem icon={<span>⚙️</span>} label="Spacing" />
          <SidebarItem icon={<span>🎭</span>} label="Shadows" />
        </SidebarGroup>
      </Sidebar>

      {/* Main Content */}
      <main className="style-guide-content">
        <div className="container">
          {/* Header */}
          <section className="section">
            <H1>Notion Design System</H1>
            <Paragraph color="secondary">
              A complete design system inspired by Notion's minimalist UI principles.
              This style guide showcases all available components and design tokens.
            </Paragraph>
          </section>

          <Divider spacing="lg" />

          {/* Typography Section */}
          <section className="section">
            <H2>Typography</H2>
            <Card padding="lg">
              <div className="typography-examples">
                <H1>Heading 1 - 36px</H1>
                <H2>Heading 2 - 30px</H2>
                <H3>Heading 3 - 24px</H3>
                <H4>Heading 4 - 20px</H4>
                <Paragraph>
                  This is a paragraph. The quick brown fox jumps over the lazy dog.
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </Paragraph>
                <Text size="sm" color="secondary">
                  Small text - secondary color
                </Text>
                <Text size="xs" color="tertiary">
                  Extra small text - tertiary color
                </Text>
              </div>
            </Card>
          </section>

          <Divider spacing="lg" />

          {/* Buttons Section */}
          <section className="section">
            <H2>Buttons</H2>
            <Card padding="lg">
              <H3>Variants</H3>
              <div className="button-grid">
                <Button variant="default">Default</Button>
                <Button variant="primary">Primary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="subtle">Subtle</Button>
                <Button variant="danger">Danger</Button>
              </div>

              <Divider spacing="md" />

              <H3>Sizes</H3>
              <div className="button-grid">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>

              <Divider spacing="md" />

              <H3>States</H3>
              <div className="button-grid">
                <Button variant="primary" loading>Loading</Button>
                <Button variant="primary" disabled>Disabled</Button>
                <Button 
                  variant="primary" 
                  leftIcon={<span>→</span>}
                >
                  With Icon
                </Button>
              </div>
            </Card>
          </section>

          <Divider spacing="lg" />

          {/* Inputs Section */}
          <section className="section">
            <H2>Input Fields</H2>
            <Card padding="lg">
              <div className="input-examples">
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  type="email"
                  fullWidth
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                
                <Input
                  label="Password"
                  placeholder="Enter password"
                  type="password"
                  helperText="Must be at least 8 characters"
                  fullWidth
                />
                
                <Input
                  label="Error Example"
                  placeholder="Enter something"
                  error="This field is required"
                  fullWidth
                />
                
                <Input
                  label="Success Example"
                  placeholder="Enter something"
                  success="Looks good!"
                  fullWidth
                />

                <Input
                  label="With Icon"
                  placeholder="Search..."
                  leftIcon={<span>🔍</span>}
                  fullWidth
                />
              </div>
            </Card>
          </section>

          <Divider spacing="lg" />

          {/* Select Section */}
          <section className="section">
            <H2>Select Dropdown</H2>
            <Card padding="lg">
              <Select
                label="Choose an option"
                placeholder="Select..."
                value={selectValue}
                onChange={setSelectValue}
                options={selectOptions}
                fullWidth
              />
            </Card>
          </section>

          <Divider spacing="lg" />

          {/* Cards Section */}
          <section className="section">
            <H2>Cards</H2>
            <div className="cards-grid">
              <Card padding="md" shadow="sm" border>
                <H4>Default Card</H4>
                <Paragraph>Simple card with border and shadow</Paragraph>
              </Card>
              
              <Card padding="md" shadow="md" hoverable>
                <H4>Hoverable Card</H4>
                <Paragraph>Hover to see the effect</Paragraph>
              </Card>
              
              <Card padding="lg" shadow="lg">
                <H4>Large Shadow</H4>
                <Paragraph>Card with larger shadow depth</Paragraph>
              </Card>
            </div>
          </section>

          <Divider spacing="lg" />

          {/* Modal Section */}
          <section className="section">
            <H2>Modal</H2>
            <Card padding="lg">
              <Button variant="primary" onClick={() => setModalOpen(true)}>
                Open Modal
              </Button>
              
              <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Example Modal"
                footer={
                  <>
                    <Button variant="subtle" onClick={() => setModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={() => setModalOpen(false)}>
                      Save Changes
                    </Button>
                  </>
                }
              >
                <Paragraph>
                  This is an example modal with a title, content area, and footer actions.
                  You can close it by clicking the X button, pressing Escape, or clicking
                  outside the modal.
                </Paragraph>
                <Divider spacing="md" />
                <Input
                  label="Name"
                  placeholder="Enter your name"
                  fullWidth
                />
              </Modal>
            </Card>
          </section>

          <Divider spacing="lg" />

          {/* Tooltip Section */}
          <section className="section">
            <H2>Tooltips</H2>
            <Card padding="lg">
              <div className="tooltip-examples">
                <Tooltip content="Top tooltip" placement="top">
                  <Button>Hover (Top)</Button>
                </Tooltip>
                
                <Tooltip content="Bottom tooltip" placement="bottom">
                  <Button>Hover (Bottom)</Button>
                </Tooltip>
                
                <Tooltip content="Left tooltip" placement="left">
                  <Button>Hover (Left)</Button>
                </Tooltip>
                
                <Tooltip content="Right tooltip" placement="right">
                  <Button>Hover (Right)</Button>
                </Tooltip>
              </div>
            </Card>
          </section>

          <Divider spacing="lg" />

          {/* Color Tokens */}
          <section className="section">
            <H2>Color Tokens</H2>
            <Card padding="lg">
              <H3>Text Colors</H3>
              <div className="color-examples">
                <div className="color-item">
                  <div className="color-swatch" style={{ backgroundColor: 'var(--nds-text-primary)' }} />
                  <Text size="sm">Primary</Text>
                </div>
                <div className="color-item">
                  <div className="color-swatch" style={{ backgroundColor: 'var(--nds-text-secondary)' }} />
                  <Text size="sm">Secondary</Text>
                </div>
                <div className="color-item">
                  <div className="color-swatch" style={{ backgroundColor: 'var(--nds-text-tertiary)' }} />
                  <Text size="sm">Tertiary</Text>
                </div>
                <div className="color-item">
                  <div className="color-swatch" style={{ backgroundColor: 'var(--nds-text-link)' }} />
                  <Text size="sm">Link</Text>
                </div>
              </div>

              <Divider spacing="md" />

              <H3>State Colors</H3>
              <div className="color-examples">
                <div className="color-item">
                  <div className="color-swatch" style={{ backgroundColor: 'var(--nds-state-info)' }} />
                  <Text size="sm">Info</Text>
                </div>
                <div className="color-item">
                  <div className="color-swatch" style={{ backgroundColor: 'var(--nds-state-success)' }} />
                  <Text size="sm">Success</Text>
                </div>
                <div className="color-item">
                  <div className="color-swatch" style={{ backgroundColor: 'var(--nds-state-warning)' }} />
                  <Text size="sm">Warning</Text>
                </div>
                <div className="color-item">
                  <div className="color-swatch" style={{ backgroundColor: 'var(--nds-state-error)' }} />
                  <Text size="sm">Error</Text>
                </div>
              </div>
            </Card>
          </section>

          <Divider spacing="lg" />

          {/* Spacing Scale */}
          <section className="section">
            <H2>Spacing Scale</H2>
            <Card padding="lg">
              <Paragraph color="secondary">
                Based on 4px grid system
              </Paragraph>
              <div className="spacing-examples">
                {[1, 2, 3, 4, 6, 8, 12].map((size) => (
                  <div key={size} className="spacing-item">
                    <div 
                      className="spacing-bar" 
                      style={{ width: `calc(var(--nds-spacing-${size}) * 4)` }}
                    />
                    <Text size="sm">spacing-{size}</Text>
                  </div>
                ))}
              </div>
            </Card>
          </section>

        </div>
      </main>
    </div>
  );
}

export default StyleGuide;
