import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import './Modal.css';

/**
 * Modal Component
 * 
 * An accessible modal dialog with overlay and focus management.
 * 
 * @component
 * @example
 * ```jsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Modal Title"
 * >
 *   <p>Modal content</p>
 * </Modal>
 * ```
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousActiveElement.current = document.activeElement;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Focus modal
      modalRef.current?.focus();
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Restore focus
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="nds-modal-overlay" onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`nds-modal nds-modal--${size} ${className}`}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="nds-modal-header">
            {title && (
              <h2 id="modal-title" className="nds-modal-title">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                className="nds-modal-close"
                onClick={onClose}
                aria-label="Close modal"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M12 4L4 12M4 4L12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="nds-modal-body">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="nds-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

Modal.propTypes = {
  /** Whether modal is open */
  isOpen: PropTypes.bool.isRequired,
  /** Close handler */
  onClose: PropTypes.func.isRequired,
  /** Modal title */
  title: PropTypes.string,
  /** Modal content */
  children: PropTypes.node.isRequired,
  /** Footer content (usually buttons) */
  footer: PropTypes.node,
  /** Modal size */
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  /** Close on overlay click */
  closeOnOverlayClick: PropTypes.bool,
  /** Close on Escape key */
  closeOnEscape: PropTypes.bool,
  /** Show close button */
  showCloseButton: PropTypes.bool,
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default Modal;
