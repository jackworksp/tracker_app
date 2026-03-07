import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Input.css'; // Reusing Input styles for consistency

/**
 * TextArea Component
 * 
 * A textarea component for multi-line text input, matching the design system Input style.
 * 
 * @component
 * @example
 * ```jsx
 * <TextArea
 *   label="Notes"
 *   placeholder="Enter your notes..."
 *   value={notes}
 *   onChange={(e) => setNotes(e.target.value)}
 *   rows={4}
 * />
 * ```
 */
const TextArea = forwardRef(({
  label,
  helperText,
  error,
  success,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  readOnly = false,
  required = false,
  fullWidth = false,
  rows = 3,
  className = '',
  id,
  name,
  ...props
}, ref) => {
  const baseClass = 'nds-input';
  const wrapperClass = `${baseClass}-wrapper`;
  const containerId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  const hasError = Boolean(error);
  const hasSuccess = Boolean(success);

  const wrapperClasses = [
    wrapperClass,
    fullWidth ? `${wrapperClass}--full-width` : '',
    className
  ].filter(Boolean).join(' ');

  const inputContainerClasses = [
    `${baseClass}-container`,
    // Textarea specific overrides or shared container styles
    hasError ? `${baseClass}-container--error` : '',
    hasSuccess ? `${baseClass}-container--success` : '',
    disabled ? `${baseClass}-container--disabled` : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label 
          htmlFor={containerId}
          className={`${baseClass}-label`}
        >
          {label}
          {required && <span className={`${baseClass}-required`} aria-label="required">*</span>}
        </label>
      )}
      
      <div className={inputContainerClasses} style={{ height: 'auto', padding: '0' }}>
        <textarea
          ref={ref}
          id={containerId}
          name={name}
          className={baseClass}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          rows={rows}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${containerId}-error` :
            hasSuccess ? `${containerId}-success` :
            helperText ? `${containerId}-helper` :
            undefined
          }
          style={{ 
            resize: 'vertical', 
            minHeight: '80px',
            width: '100%',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            outline: 'none'
          }}
          {...props}
        />
      </div>

      {error && (
        <p 
          id={`${containerId}-error`}
          className={`${baseClass}-message ${baseClass}-message--error`}
          role="alert"
        >
          {error}
        </p>
      )}

      {success && !error && (
        <p 
          id={`${containerId}-success`}
          className={`${baseClass}-message ${baseClass}-message--success`}
        >
          {success}
        </p>
      )}

      {helperText && !error && !success && (
        <p 
          id={`${containerId}-helper`}
          className={`${baseClass}-message ${baseClass}-message--helper`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

TextArea.displayName = 'TextArea';

TextArea.propTypes = {
  /** Input label */
  label: PropTypes.string,
  /** Helper text below input */
  helperText: PropTypes.string,
  /** Error message */
  error: PropTypes.string,
  /** Success message */
  success: PropTypes.string,
  /** Placeholder text */
  placeholder: PropTypes.string,
  /** Input value */
  value: PropTypes.string,
  /** Change handler */
  onChange: PropTypes.func,
  /** Focus handler */
  onFocus: PropTypes.func,
  /** Blur handler */
  onBlur: PropTypes.func,
  /** Disable input */
  disabled: PropTypes.bool,
  /** Read-only input */
  readOnly: PropTypes.bool,
  /** Required field */
  required: PropTypes.bool,
  /** Full width input */
  fullWidth: PropTypes.bool,
  /** Rows */
  rows: PropTypes.number,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Input ID */
  id: PropTypes.string,
  /** Input name */
  name: PropTypes.string,
};

export default TextArea;
