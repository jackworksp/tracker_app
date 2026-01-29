import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    mockOnSignup.mockResolvedValueOnce({});
    render(<SignupModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

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
    render(<SignupModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'mismatch' } });
    fireEvent.blur(screen.getByLabelText('Confirm Password'));
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    expect(mockOnSignup).not.toHaveBeenCalled();
  });
});
