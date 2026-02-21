# Error Messages Too Generic (HIGH)

**Priority:** 🟠 HIGH
**Status:** Open
**Category:** User Experience, UX Writing

## Problem

Error messages are generic and don't provide actionable guidance. Examples:
- "Failed to load tasks" (no explanation why or what to do)
- Form validation shows error borders but no inline error messages
- "Required" is too vague

## Impact

- Users don't understand what went wrong
- No guidance on how to fix the problem
- Increased support requests
- User frustration and app abandonment

## Solution

### 1. Network Error Messages

**Before:**
```jsx
message.error('Failed to load tasks');
```

**After:**
```jsx
message.error("Couldn't load tasks. Check your internet connection and try again.");
```

### 2. Form Validation Errors

**Before:**
```jsx
{errors.activity && <span className="error-border" />}
```

**After:**
```jsx
{errors.activity && (
  <div className="nds-input-message--error">
    <AlertCircle size={16} />
    <span>Please enter an activity name (e.g., "Study React Hooks")</span>
  </div>
)}
```

### 3. Specific Error Messages

```jsx
// errorMessages.js
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: "Can't connect to server. Check your internet connection.",
  TIMEOUT_ERROR: "Request timed out. Please try again.",
  SERVER_ERROR: "Something went wrong on our end. Try again in a moment.",

  // Authentication errors
  INVALID_CREDENTIALS: "Email or password is incorrect. Please try again.",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",

  // Validation errors
  REQUIRED_FIELD: (fieldName) => `${fieldName} is required`,
  INVALID_EMAIL: "Please enter a valid email address",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters",
  INVALID_DATE: "Please select a valid date",
  FUTURE_DATE_REQUIRED: "Date must be in the future",

  // Task errors
  TASK_TITLE_REQUIRED: "Please enter a task title (e.g., 'Study for exam')",
  TASK_DELETE_FAILED: "Couldn't delete task. Please try again.",
  TASK_UPDATE_FAILED: "Couldn't save changes. Check your connection.",

  // Session errors
  SESSION_ACTIVITY_REQUIRED: "Please enter what you studied (e.g., 'React Hooks')",
  SESSION_DURATION_INVALID: "Duration must be between 1 minute and 12 hours",

  // Attachment errors
  FILE_TOO_LARGE: (maxSize) => `File is too large. Maximum size is ${maxSize}MB`,
  INVALID_FILE_TYPE: (allowed) => `Invalid file type. Allowed: ${allowed.join(', ')}`,
  UPLOAD_FAILED: "Upload failed. Check your connection and try again.",
};
```

### 4. Error Display Component

```jsx
// FormErrorMessage.jsx
import { AlertCircle } from 'lucide-react';

export function FormErrorMessage({ message, icon = true }) {
  if (!message) return null;

  return (
    <div className="nds-input-message--error" role="alert">
      {icon && <AlertCircle size={16} />}
      <span>{message}</span>
    </div>
  );
}
```

```css
/* FormErrorMessage.css */
.nds-input-message--error {
  display: flex;
  align-items: flex-start;
  gap: var(--nds-spacing-2);
  margin-top: var(--nds-spacing-2);
  padding: var(--nds-spacing-2) var(--nds-spacing-3);
  background: var(--nds-bg-danger-subtle);
  border-left: 3px solid var(--nds-border-danger);
  border-radius: var(--nds-radius-sm);
  font-size: 13px;
  color: var(--nds-text-danger);
  line-height: 1.4;
}
```

## Examples of Improved Error Messages

| Context | Before | After |
|---------|--------|-------|
| Network | "Failed to load tasks" | "Can't connect to server. Check your internet connection and try again." |
| Required field | "Required" | "Please enter a task title (e.g., 'Study for exam')" |
| Invalid email | "Invalid" | "Please enter a valid email address (e.g., you@example.com)" |
| File upload | "Upload failed" | "Upload failed (file too large). Maximum size is 10MB. Try a smaller file." |
| Date validation | "Invalid date" | "Please select a date in the future" |

## Files to Create

- `/frontend-web/src/utils/errorMessages.js`
- `/frontend-web/src/components/FormErrorMessage.jsx`
- `/frontend-web/src/components/FormErrorMessage.css`

## Files to Update

- `/frontend-web/src/components/AddTaskModal.jsx`
- `/frontend-web/src/components/AddSessionModal.jsx`
- `/frontend-web/src/components/NotesPage.jsx`
- `/frontend-web/src/components/AttachmentsTab.jsx`
- `/frontend-web/src/api.js` (centralized error handling)

## Testing

1. Trigger each error scenario
2. Verify error message is clear and actionable
3. Test with screen reader (messages should be announced)
4. Verify errors have role="alert"
5. Test error persistence (clear when fixed)

## References

- [Error Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/)
- [Writing Better Error Messages](https://uxdesign.cc/how-to-write-error-messages-that-dont-suck-f85b01e93c41)
