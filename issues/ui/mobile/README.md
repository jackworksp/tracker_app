# Mobile UI Issues - Vela Android App

This directory contains detailed issue tracking for UX/UI improvements identified in the mobile app UX review conducted on 2026-02-21.

## Overview

**Total Issues:** 11
- 🔴 **Critical:** 2
- 🟠 **High:** 4
- 🟡 **Medium:** 4
- 🟢 **Low:** 1

**Review Source:** UX Reviewer Agent (Agent ID: a05d942)

## Issues by Priority

### 🔴 Critical Priority

These issues block accessibility certification and significantly impact usability for users with disabilities.

| # | Issue | Impact | Files to Update |
|---|-------|--------|-----------------|
| [01](01-touch-targets-too-small.md) | **Touch Targets Too Small** | WCAG Level A violation - users with motor impairments cannot reliably tap elements | Modal.css, Input.css, BottomNav.css |
| [02](02-bottom-nav-text-too-small.md) | **Bottom Nav Text Too Small** | 9px text fails WCAG AAA - hard to read for users 40+ | BottomNav.css |

**Action Required:** Fix immediately before next release.

---

### 🟠 High Priority

These issues significantly degrade user experience and feature discoverability.

| # | Issue | Impact | Estimated Effort |
|---|-------|--------|------------------|
| [03](03-missing-onboarding-flow.md) | **Missing Onboarding Flow** | Users won't discover key features (swipe, camera, share) | ~4 hours |
| [04](04-navigation-no-back-button.md) | **No Back Button in Deep Views** | Users feel lost in nested content | ~2 hours |
| [05](05-share-modal-no-subject-indicator.md) | **Share Modal - No Subject Indicator** | Users uncertain where content is stored | ~1 hour |
| [06](06-error-messages-generic.md) | **Error Messages Too Generic** | Users don't know how to fix problems | ~3 hours |

**Action Required:** Prioritize for upcoming sprint.

---

### 🟡 Medium Priority

These issues improve polish, perceived performance, and accessibility.

| # | Issue | Impact | Estimated Effort |
|---|-------|--------|------------------|
| [07](07-skeleton-loading-states.md) | **Skeleton Loading States Missing** | App feels slower than it is | ~3 hours |
| [08](08-haptic-feedback-missing.md) | **Haptic Feedback Missing** | Less satisfying mobile experience | ~2 hours |
| [09](09-reduced-motion-support.md) | **Reduced Motion Support Missing** | Excludes users with motion sensitivity (WCAG AAA) | ~2 hours |
| [10](10-swipe-gesture-affordance.md) | **Swipe Gesture Affordance Missing** | Users won't discover swipe functionality | ~2 hours |

**Action Required:** Include in polish/accessibility sprint.

---

### 🟢 Low Priority

These issues are minor polish improvements.

| # | Issue | Impact | Estimated Effort |
|---|-------|--------|------------------|
| [11](11-spacing-inconsistencies.md) | **Spacing Inconsistencies** | Wastes vertical space on small screens | ~30 min |

**Action Required:** Include in next cleanup/refactor cycle.

---

## Implementation Roadmap

### Sprint 1: Critical Fixes (Week 1)
- [ ] Fix touch target sizes (Issue #01)
- [ ] Increase bottom nav text size (Issue #02)
- [ ] Add back button to detail views (Issue #04)

**Goal:** Pass accessibility audit, improve core usability

---

### Sprint 2: User Experience (Week 2)
- [ ] Add onboarding flow (Issue #03)
- [ ] Improve error messages (Issue #06)
- [ ] Add subject indicator to share modal (Issue #05)
- [ ] Add skeleton loading states (Issue #07)

**Goal:** Improve feature discoverability and user confidence

---

### Sprint 3: Polish & Accessibility (Week 3)
- [ ] Add haptic feedback (Issue #08)
- [ ] Add reduced motion support (Issue #09)
- [ ] Add swipe gesture affordances (Issue #10)
- [ ] Fix spacing inconsistencies (Issue #11)

**Goal:** Professional polish and full accessibility compliance

---

## Testing Plan

### Accessibility Testing
- [ ] Run axe DevTools audit
- [ ] Test with TalkBack screen reader (Android)
- [ ] Test with system font scaling (up to 200%)
- [ ] Test with reduced motion enabled
- [ ] Verify WCAG 2.1 Level AA compliance

### Device Testing
- [ ] Small screen (iPhone SE 1st gen, 320px width)
- [ ] Medium screen (iPhone 12, 390px width)
- [ ] Large screen (Pixel 7 Pro, 412px width)
- [ ] Notched device (safe area insets)
- [ ] Tablet (iPad mini, 768px width)

### User Testing
- [ ] Test with 5 new users (onboarding experience)
- [ ] Test with users 40+ (text readability)
- [ ] Test with users with motor impairments (touch targets)
- [ ] A/B test swipe affordance options

---

## Quick Links

### Documentation
- [CLAUDE.md](../../../CLAUDE.md) - Technical architecture
- [FEATURES.md](../../../FEATURES.md) - User features guide
- [Design System](../../../frontend-web/src/design-system/README.md)

### Related Code
- [App.jsx](../../../frontend-web/src/App.jsx) - Main app component
- [Tasks.jsx](../../../frontend-web/src/components/Tasks.jsx) - Task management
- [BottomNav.jsx](../../../frontend-web/src/components/BottomNav.jsx) - Navigation
- [Design System](../../../frontend-web/src/design-system/) - UI components

### External Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Accessibility](https://material.io/design/usability/accessibility.html)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility)

---

## Issue Template

When creating new issues, use this structure:

```markdown
# Issue Title (PRIORITY)

**Priority:** 🔴/🟠/🟡/🟢
**Status:** Open/In Progress/Blocked/Closed
**Category:** Accessibility/UX/Visual Design/Performance

## Problem
[Description of the issue]

## Impact
[How this affects users]

## Solution
[Proposed fix with code examples]

## Files to Update
- File 1
- File 2

## Testing
[How to verify the fix works]

## References
[Links to docs, specs, examples]
```

---

## Progress Tracking

**Last Updated:** 2026-02-21
**Issues Completed:** 0/11
**Sprint Progress:** Sprint 1 not started

### Completion Checklist

#### Critical (Must Fix)
- [ ] Issue #01: Touch Targets
- [ ] Issue #02: Bottom Nav Text

#### High (Should Fix)
- [ ] Issue #03: Onboarding
- [ ] Issue #04: Back Button
- [ ] Issue #05: Subject Indicator
- [ ] Issue #06: Error Messages

#### Medium (Nice to Have)
- [ ] Issue #07: Skeleton Loading
- [ ] Issue #08: Haptic Feedback
- [ ] Issue #09: Reduced Motion
- [ ] Issue #10: Swipe Affordance

#### Low (Polish)
- [ ] Issue #11: Spacing

---

## Contributing

When working on these issues:

1. **Read the full issue document** before starting
2. **Test on physical device** (not just browser DevTools)
3. **Update this README** when issues are completed
4. **Add screenshots** to issue docs showing before/after
5. **Update CLAUDE.md** if architecture changes
6. **Write tests** for critical fixes

---

## Questions?

For clarification on any issue, refer to:
- Full UX review transcript (Agent a05d942)
- [CLAUDE.md](../../../CLAUDE.md) development guide
- Design system documentation

---

**Generated by:** UX Reviewer Agent
**Review Date:** 2026-02-21
**Next Review:** After Sprint 3 completion
