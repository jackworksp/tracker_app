import React, { forwardRef, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Select.css';

/**
 * Select/Dropdown Component
 * 
 * A custom select dropdown with Notion-style aesthetics.
 * 
 * @component
 * @example
 * ```jsx
 * <Select
 *   label="Choose option"
 *   value={value}
 *   onChange={setValue}
 *   options={[
 *     { value: '1', label: 'Option 1' },
 *     { value: '2', label: 'Option 2' }
 *   ]}
 * />
 * ```
 */
const Select = forwardRef(({
  label,
  helperText,
  error,
  placeholder = 'Select an option',
  value,
  onChange,
  options = [],
  disabled = false,
  required = false,
  fullWidth = false,
  size = 'md',
  className = '',
  id,
  name,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const baseClass = 'nds-select';
  const containerId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue) => {
    onChange?.(optionValue);
    setIsOpen(false);
  };

  const wrapperClasses = [
    `${baseClass}-wrapper`,
    fullWidth ? `${baseClass}-wrapper--full-width` : '',
    className
  ].filter(Boolean).join(' ');

  const triggerClasses = [
    `${baseClass}-trigger`,
    `${baseClass}-trigger--${size}`,
    error ? `${baseClass}-trigger--error` : '',
    disabled ? `${baseClass}-trigger--disabled` : '',
    isOpen ? `${baseClass}-trigger--open` : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses} ref={selectRef}>
      {label && (
        <label htmlFor={containerId} className={`${baseClass}-label`}>
          {label}
          {required && <span className={`${baseClass}-required`}>*</span>}
        </label>
      )}

      <button
        ref={ref}
        id={containerId}
        type="button"
        className={triggerClasses}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        {...props}
      >
        <span className={`${baseClass}-value`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`${baseClass}-icon ${isOpen ? `${baseClass}-icon--open` : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <ul className={`${baseClass}-menu`} role="listbox">
          {options.map((option) => (
            <li
              key={option.value}
              role="option"
              aria-selected={value === option.value}
              className={`${baseClass}-option ${
                value === option.value ? `${baseClass}-option--selected` : ''
              }`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </li>
          ))}
          {options.length === 0 && (
            <li className={`${baseClass}-option ${baseClass}-option--empty`}>
              No options available
            </li>
          )}
        </ul>
      )}

      {error && (
        <p className={`${baseClass}-message ${baseClass}-message--error`}>
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className={`${baseClass}-message`}>
          {helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

Select.propTypes = {
  label: PropTypes.string,
  helperText: PropTypes.string,
  error: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
};

export default Select;
