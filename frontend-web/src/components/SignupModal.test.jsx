import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SignupModal from './SignupModal';

// Mock matchMedia for Ant Design
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('SignupModal', () => {
  const mockOnSignup = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnSwitchToLogin = vi.fn();

  const defaultProps = {
    visible: true,
    onClose: mockOnClose,
    onSignup: mockOnSignup,
    onSwitchToLogin: mockOnSwitchToLogin,
  };

  it('renders correctly when visible', () => {
    render(<SignupModal {...defaultProps} />);
    
    expect(screen.getByText('Create Account 🚀')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('calls onSignup with form values when valid', async () => {
    const user = userEvent.setup();
    mockOnSignup.mockResolvedValueOnce({});
    render(<SignupModal {...defaultProps} />);

    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockOnSignup).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
    }, { timeout: 3000 });
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<SignupModal {...defaultProps} />);

    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'mismatch');
    
    // Tab away to trigger blur validation if needed, though Submit should trigger it too
    await user.tab();
    
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    expect(mockOnSignup).not.toHaveBeenCalled();
  });
});
