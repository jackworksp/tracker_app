import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Input.css';

/**
 * Input/TextField Component
 * 
 * A versatile input field with support for icons, validation states, and labels.
 * 
 * @component
 * @example
 * ```jsx
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 * />
 * ```
 */
const Input = forwardRef(({
  label,
  helperText,
  error,
  success,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  type = 'text',
  disabled = false,
  readOnly = false,
  required = false,
  fullWidth = false,
  size = 'md',
  leftIcon = null,
  rightIcon = null,
  className = '',
  id,
  name,
  ...props
}, ref) => {
  const baseClass = 'nds-input';
  const wrapperClass = `${baseClass}-wrapper`;
  const containerId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const hasError = Boolean(error);
  const hasSuccess = Boolean(success);
  const hasLeftIcon = Boolean(leftIcon);
  const hasRightIcon = Boolean(rightIcon);

  const wrapperClasses = [
    wrapperClass,
    fullWidth ? `${wrapperClass}--full-width` : '',
    className
  ].filter(Boolean).join(' ');

  const inputContainerClasses = [
    `${baseClass}-container`,
    `${baseClass}-container--${size}`,
    hasError ? `${baseClass}-container--error` : '',
    hasSuccess ? `${baseClass}-container--success` : '',
    disabled ? `${baseClass}-container--disabled` : '',
    hasLeftIcon ? `${baseClass}-container--has-left-icon` : '',
    hasRightIcon ? `${baseClass}-container--has-right-icon` : '',
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
      
      <div className={inputContainerClasses}>
        {leftIcon && (
          <span className={`${baseClass}-icon ${baseClass}-icon--left`}>
            {leftIcon}
          </span>
        )}
        
        <input
          ref={ref}
          id={containerId}
          name={name}
          type={type}
          className={baseClass}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${containerId}-error` :
            hasSuccess ? `${containerId}-success` :
            helperText ? `${containerId}-helper` :
            undefined
          }
          {...props}
        />
        
        {rightIcon && (
          <span className={`${baseClass}-icon ${baseClass}-icon--right`}>
            {rightIcon}
          </span>
        )}
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

Input.displayName = 'Input';

Input.propTypes = {
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
  /** Input type */
  type: PropTypes.string,
  /** Disable input */
  disabled: PropTypes.bool,
  /** Read-only input */
  readOnly: PropTypes.bool,
  /** Required field */
  required: PropTypes.bool,
  /** Full width input */
  fullWidth: PropTypes.bool,
  /** Input size */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Icon on left side */
  leftIcon: PropTypes.node,
  /** Icon on right side */
  rightIcon: PropTypes.node,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Input ID */
  id: PropTypes.string,
  /** Input name */
  name: PropTypes.string,
};

export default Input;
