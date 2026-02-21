# Missing Onboarding Flow (HIGH)

**Priority:** 🟠 HIGH
**Status:** Open
**Category:** User Experience, Feature Discovery

## Problem

No first-run tutorial or feature discovery mechanism exists. New users won't discover:
- Swipe gestures (swipe left to complete tasks, swipe right to delete)
- Camera integration for capturing study materials
- Share target capability (share content from other apps to Vela)
- Key features and workflows

## Impact

- Poor feature discoverability
- Users miss powerful functionality
- Higher learning curve
- Reduced app engagement
- Support requests for "how do I...?"

## Solution

Implement **3-step tooltip walkthrough** on first launch:

### Step 1: Swipe Gestures
```jsx
<OnboardingTooltip
  target=".task-card:first-child"
  title="Swipe to Take Action"
  message="Swipe left to complete tasks, swipe right to delete"
  icon={<SwipeHorizontal />}
/>
```

### Step 2: Camera Integration
```jsx
<OnboardingTooltip
  target=".camera-button"
  title="Capture Study Materials"
  message="Tap the camera icon to quickly save notes, diagrams, or screenshots"
  icon={<Camera />}
/>
```

### Step 3: Share Target
```jsx
<OnboardingTooltip
  target=".profile-tab"
  title="Share from Any App"
  message="Share YouTube videos, articles, or links from any app directly to Vela"
  icon={<Share2 />}
/>
```

### Implementation Details

```jsx
// OnboardingTooltips.jsx
import { useState, useEffect } from 'react';
import { Modal } from '../design-system';

export function OnboardingTooltips() {
  const [step, setStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(
    localStorage.getItem('hasSeenOnboarding') === 'true'
  );

  const steps = [
    {
      target: '.task-card',
      title: 'Swipe to Take Action',
      message: 'Swipe left to complete tasks, swipe right to delete',
      icon: '👆'
    },
    {
      target: '.camera-button',
      title: 'Capture Study Materials',
      message: 'Tap camera icon to save notes and screenshots',
      icon: '📸'
    },
    {
      target: '.share-button',
      title: 'Share from Any App',
      message: 'Share links and videos from other apps to Vela',
      icon: '🔗'
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setHasSeenOnboarding(true);
  };

  if (hasSeenOnboarding) return null;

  return (
    <Modal
      visible={!hasSeenOnboarding}
      onCancel={handleComplete}
      footer={
        <button onClick={handleNext}>
          {step < steps.length - 1 ? 'Next' : 'Get Started'}
        </button>
      }
    >
      <div className="onboarding-tooltip">
        <div className="icon">{steps[step].icon}</div>
        <h3>{steps[step].title}</h3>
        <p>{steps[step].message}</p>
        <div className="progress-dots">
          {steps.map((_, i) => (
            <span key={i} className={i === step ? 'active' : ''} />
          ))}
        </div>
      </div>
    </Modal>
  );
}
```

### Store Onboarding State
```js
// localStorage keys
hasSeenOnboarding: boolean
```

## Files to Create

- `/frontend-web/src/components/OnboardingTooltips.jsx`
- `/frontend-web/src/components/OnboardingTooltips.css`

## Files to Update

- `/frontend-web/src/App.jsx` (add OnboardingTooltips component)

## Testing

1. Clear localStorage and test first-run experience
2. Verify tooltips appear in correct order
3. Test skip/dismiss functionality
4. Ensure tooltips don't reappear after completion
5. Test on different screen sizes

## Optional Enhancements

- Add "Skip" button for experienced users
- Track which features users actually use after onboarding
- Add contextual help button to replay onboarding
- Animate tooltip position to highlight target element

## References

- [User Onboarding Best Practices](https://www.appcues.com/blog/user-onboarding-best-practices)
- [Mobile Onboarding UX Patterns](https://www.nngroup.com/articles/mobile-instructional-overlay/)
