# Skills - Issue & Task Management System

## Overview

Lightweight issue and task tracking system for the Vela study tracker project. Focuses on documenting problems, solutions, and learnings for future reference.

## Quick Reference

| What | Where | Template |
|------|-------|----------|
| New bug/problem | `issues/pending/issue-XXX-name.md` | [Pending Issue](#pending-issue-template) |
| Bug fixed | Move to `issues/completed/` | [Completed Issue](#completed-issue-template) |
| Detailed writeup | `issues/journal/issue-XXX-journal.md` | [Issue Journal](#issue-journal-template) |
| New feature/task | `tasks/pending/task-XXX-name.md` | [Pending Task](#pending-task-template) |
| Task done | Move to `tasks/completed/` | [Completed Task](#completed-task-template) |
| Implementation story | `tasks/journal/task-XXX-journal.md` | [Task Journal](#task-journal-template) |

## Directory Structure

```
studytracker/
├── issues/
│   ├── completed/           # Resolved issues
│   ├── pending/             # Active/open issues
│   ├── journal/             # Detailed resolution journals
│   └── README.md            # Issue index
├── tasks/
│   ├── completed/           # Completed tasks
│   ├── pending/             # Active/planned tasks
│   ├── journal/             # Task completion journals
│   └── README.md            # Task index
└── skills.md                # This file
```

---

# Issues (Bugs & Problems)

## Naming Convention

**Format**: `issue-{number}-{short-description}.md`

**Examples**:
- `issue-001-database-connection-timeout.md`
- `issue-002-authentication-token-expiry.md`
- `issue-003-mobile-build-crash.md`

## Lifecycle

1. **New Issue** → Create in `issues/pending/`
2. **Working on it** → Update status in file
3. **Issue Resolved** → Move to `issues/completed/`
4. **Document learnings** → Create journal in `issues/journal/`

## Pending Issue Template

```markdown
# Issue #XXX: [Short Description]

**Status**: Pending | In Progress | Blocked
**Priority**: High | Medium | Low
**Created**: YYYY-MM-DD
**Component**: Backend | Frontend | Database | Mobile | DevOps
**Links**: [ClickUp/GitHub/etc]

## Problem

[1-2 paragraph description of what's broken]

## Steps to Reproduce

1. Step one
2. Step two
3. Observed result

**Expected**: [What should happen]
**Actual**: [What actually happens]

## Error Messages

```
[Paste error logs, stack traces, screenshots]
```

## Environment

- OS: Windows 11 / Ubuntu 22.04 / macOS
- Node: v20.x
- Database: Neon PostgreSQL
- Browser: Chrome/Firefox/Safari (if frontend)

## Impact

[Who is affected? How severely?]

## Hypotheses

- Possible cause 1
- Possible cause 2

## Related

- Related to #XXX
- Blocked by #XXX
```

## Completed Issue Template

```markdown
# Issue #XXX: [Short Description] ✓

**Status**: Completed
**Priority**: High | Medium | Low
**Created**: YYYY-MM-DD
**Resolved**: YYYY-MM-DD
**Resolution Time**: [X hours/days]

## Problem Summary

[1-2 sentences describing the issue]

## Solution

[High-level description of the fix]

## Files Changed

- `path/to/file1.js` - What changed
- `path/to/file2.jsx` - What changed

## Testing

- [x] Tested the fix
- [x] Regression tested
- [x] Mobile tested (if applicable)

## Deployed

- **Version**: vX.X.X
- **Date**: YYYY-MM-DD

## Journal

See detailed writeup: `issues/journal/issue-XXX-journal.md`
```

## Issue Journal Template

**Purpose**: Deep dive into the issue - root cause, investigation process, learnings.

```markdown
# Issue #XXX Journal: [Description]

**Date Resolved**: YYYY-MM-DD
**Author**: [Name]

---

## Summary

[One paragraph: What broke, why it broke, how we fixed it, key learnings]

## Root Cause

**Primary Cause**: [The actual reason it failed]

**Contributing Factors**:
- Factor 1
- Factor 2

**Why We Missed It**:
- Lack of test coverage in X area
- Edge case not considered
- [etc]

## Investigation

### Timeline

**YYYY-MM-DD HH:MM** - Discovered issue
- User reported: [description]
- Initial symptoms: [what we saw]

**YYYY-MM-DD HH:MM** - Hypothesis 1
- Thought it was X
- Tested by: [method]
- Result: ❌ Not the cause

**YYYY-MM-DD HH:MM** - Hypothesis 2
- Realized it might be Y
- Tested by: [method]
- Result: ✅ Found it!

### The Fix

**File**: `backend/routes/auth.js`
```javascript
// BEFORE
const token = jwt.sign({ userId }, SECRET);

// AFTER
const token = jwt.sign({ userId }, SECRET, { expiresIn: '7d' });
```

**Why this works**: Tokens now expire, preventing stale token issues.

## Effort Breakdown

**Total Time**: 4 hours

| Activity | Time | Notes |
|----------|------|-------|
| Investigation | 2h | Tried 3 different approaches |
| Implementation | 1h | Simple fix once identified |
| Testing | 1h | Manual + automated tests |

**Complexity**: Low | Medium | High

## Key Learnings

1. **Always check token expiration** - JWT tokens should have expiry
2. **Test edge cases** - Stale tokens weren't in our test suite
3. **Error messages matter** - Generic "Unauthorized" hid the real issue

## Prevention

- [x] Added test for token expiry
- [x] Updated auth middleware to check expiry
- [x] Added monitoring for token errors

## References

- [JWT Best Practices](https://example.com)
- [Stack Overflow discussion](https://example.com)
```

---

# Tasks (Features & Work Items)

## Naming Convention

**Format**: `task-{number}-{short-description}.md`

**Examples**:
- `task-001-add-user-authentication.md`
- `task-002-implement-dark-mode.md`
- `task-003-mobile-notification-system.md`

## Lifecycle

1. **New Task** → Create in `tasks/pending/`
2. **In Progress** → Update status in file
3. **Task Completed** → Move to `tasks/completed/`
4. **Document process** → Create journal in `tasks/journal/`

## Pending Task Template

```markdown
# Task #XXX: [Short Description]

**Status**: Pending | In Progress | Blocked
**Priority**: High | Medium | Low
**Type**: Feature | Enhancement | Refactor | Documentation
**Created**: YYYY-MM-DD
**Estimate**: [X hours/days]
**Component**: Backend | Frontend | Database | Mobile | DevOps
**Links**: [ClickUp/GitHub/etc]

## Objective

[Clear, 1-2 sentence description of what needs to be done]

## Success Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Requirements

### Functional
1. Must do X
2. Must do Y
3. Should do Z (nice-to-have)

### Non-Functional
- Performance: [requirements]
- Security: [requirements]
- Accessibility: [requirements]

## Technical Approach

### Proposed Solution

[Description of how you'll implement this]

### Database Changes

```sql
-- If needed
CREATE TABLE new_table (...);
```

### API Changes

**New Endpoints**:
- `POST /api/endpoint` - Description
- `GET /api/endpoint/:id` - Description

### UI Changes

[Wireframes, mockups, or descriptions]

## Implementation Plan

### Phase 1: [Name]
- Step 1
- Step 2
- Estimated: X hours

### Phase 2: [Name]
- Step 1
- Step 2
- Estimated: X hours

## Dependencies

- Requires: Task #XXX
- Blocked by: Issue #XXX
- Related: Task #XXX

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Risk 1 | Low/Med/High | Low/Med/High | How to handle |
```

## Completed Task Template

```markdown
# Task #XXX: [Short Description] ✓

**Status**: Completed
**Priority**: High | Medium | Low
**Type**: Feature | Enhancement | Refactor
**Created**: YYYY-MM-DD
**Completed**: YYYY-MM-DD
**Actual Effort**: [X hours/days]

## Summary

[2-3 sentences describing what was accomplished]

## Deliverables

- [x] Deliverable 1
- [x] Deliverable 2
- [x] Deliverable 3

## Implementation

[High-level description of how it was implemented]

## Files Changed

### Backend
- `backend/routes/new-route.js` - Description

### Frontend
- `frontend-web/src/components/NewComponent.jsx` - Description

### Database
- Migration: `001-add-new-table.sql`

## Testing

- [x] Unit tests added
- [x] Integration tests passed
- [x] Manual testing completed
- [x] Mobile tested

## Documentation

- [x] CLAUDE.md updated
- [x] README updated
- [x] API docs updated

## Deployed

- **Version**: vX.X.X
- **Date**: YYYY-MM-DD

## Journal

See detailed writeup: `tasks/journal/task-XXX-journal.md`
```

## Task Journal Template

**Purpose**: Document the implementation journey - decisions, challenges, learnings.

```markdown
# Task #XXX Journal: [Description]

**Date Completed**: YYYY-MM-DD
**Author**: [Name]

---

## Summary

[One paragraph: What was built, how it was built, challenges faced, outcomes]

## Planning & Research

**Initial Scope**: [What we thought we'd build]

**Research Done**:
- Explored technology X
- Compared approach A vs B
- Chose B because: [rationale]

**Architecture Decisions**:
1. **Decision**: Use PostgreSQL instead of MongoDB
   - **Rationale**: Relational data, better for our schema
   - **Trade-offs**: Less flexible, but more structured

## Implementation Journey

### Phase 1: Backend Setup (Day 1-2)

**Goal**: Create API endpoints for new feature

**Work Done**:
- Created `backend/routes/skills.js`
- Added database schema
- Implemented CRUD operations

**Challenges**:
- **Issue**: Database migration failed on first attempt
- **Solution**: Fixed FK constraint order
- **Time Lost**: +2 hours

**Code Highlight**:
```javascript
// Key implementation - skill proficiency tracking
router.put('/:id/proficiency', async (req, res) => {
  const { proficiency_level } = req.body;
  // ... validation and update
});
```

### Phase 2: Frontend Integration (Day 3-4)

**Goal**: Build UI for skill management

**Work Done**:
- Created SkillsPage component
- Added skill cards with proficiency indicators
- Integrated with task linking

**Challenges**:
- **Issue**: Masonry layout breaking on mobile
- **Solution**: Used CSS `column-count` instead of flexbox
- **Time Lost**: +1 hour

## Effort Breakdown

**Total Time**: 18 hours
**Original Estimate**: 16 hours
**Variance**: +2 hours (+12.5%)

| Phase | Estimated | Actual | Variance | Notes |
|-------|-----------|--------|----------|-------|
| Backend | 6h | 8h | +2h | Migration issues |
| Frontend | 6h | 6h | 0h | Went smoothly |
| Testing | 2h | 2h | 0h | Good coverage |
| Documentation | 2h | 2h | 0h | On track |

**Complexity**: Medium

## Key Learnings

### What Went Well ✓
1. **Planning paid off** - Clear architecture made implementation smooth
2. **Reusable components** - Design system components saved time
3. **Test-driven** - Tests caught issues early

### Challenges Overcome ⚡
1. **Database migration order**
   - **Problem**: FK constraints failed
   - **Solution**: Create tables in dependency order
   - **Learning**: Always check FK dependencies first

2. **Mobile layout issues**
   - **Problem**: Flexbox masonry broke on small screens
   - **Solution**: CSS `column-count` with responsive breakpoints
   - **Learning**: CSS columns work better for masonry

### What Could Be Improved ⚠
1. **Better error handling** - Need more specific error messages
2. **Loading states** - UI should show loading indicators
3. **Offline support** - Consider PWA caching

### Tools Used 🛠
- PostgreSQL - Database
- React Testing Library - Tests
- Lucide Icons - UI icons
- CSS Grid/Flexbox - Layout

## Quality Assurance

### Testing
```javascript
test('should update skill proficiency', async () => {
  const result = await api.skills.updateProficiency(1, 'EXPERT');
  expect(result.proficiency_level).toBe('EXPERT');
});
```

**Coverage**: Before 75% → After 82% (+7%)

### Manual Testing
- [x] All CRUD operations work
- [x] Task linking works correctly
- [x] Mobile responsive
- [x] Error handling works

### Performance
- API response time: <100ms
- Page load time: <2s
- No memory leaks detected

## Deployment

**Date**: 2026-02-15
**Version**: v1.1.0
**Process**:
1. Merged to main
2. CI/CD pipeline ran
3. Deployed to production
4. Verified live

**Rollback Plan**: Git revert + database migration rollback

## Follow-up Actions

### Immediate
- [ ] Monitor error rates for 24h
- [ ] Gather user feedback

### Short-term (1-2 weeks)
- [ ] Add skill analytics dashboard
- [ ] Implement skill recommendations

### Long-term (1-3 months)
- [ ] Skill progress tracking over time
- [ ] Integration with learning resources

## References

- [Design mockups](https://figma.com/...)
- [API documentation](https://docs.com/...)
- [Stack Overflow thread](https://stackoverflow.com/...)
```

---

# Workflows & Best Practices

## Creating a New Issue

1. Create file in `issues/pending/` using template
2. Assign unique issue number (next in sequence)
3. Fill all sections thoroughly
4. Link to related issues/tasks

## Resolving an Issue

1. Fix the problem
2. Move file from `pending/` to `completed/`
3. Update with resolution details
4. Create journal entry (if significant)
5. Link journal in completed issue

## Creating a New Task

1. Create file in `tasks/pending/` using template
2. Assign unique task number (next in sequence)
3. Define clear success criteria
4. Estimate effort honestly

## Completing a Task

1. Implement all requirements
2. Complete testing
3. Update documentation
4. Move file from `pending/` to `completed/`
5. Create journal entry (if significant)
6. Link journal in completed task

## Numbering Convention

- **Issues**: Sequential starting from 001 (`issue-001`, `issue-002`, ...)
- **Tasks**: Sequential starting from 001 (`task-001`, `task-002`, ...)
- Numbers are never reused
- Maintain index in README.md for each category

## Best Practices

### For Issues
- ✅ **Be Specific** - Include exact error messages and stack traces
- ✅ **Be Reproducible** - Provide clear steps anyone can follow
- ✅ **Document Everything** - Record what you tried, even failures
- ✅ **Link Context** - Reference commits, PRs, related issues

### For Tasks
- ✅ **Define Success** - Clear, measurable completion criteria
- ✅ **Break Down** - Split large tasks into smaller chunks
- ✅ **Estimate Honestly** - Track actual vs estimated to improve
- ✅ **Document Decisions** - Explain why you chose this approach

### For Journals
- ✅ **Write Immediately** - Document while fresh in your mind
- ✅ **Be Honest** - Include failures and mistakes, not just wins
- ✅ **Focus on Learning** - Extract lessons for future
- ✅ **Link Everything** - Code snippets, resources, references
- ✅ **Think Future You** - What would help you 6 months from now?

## Journal Writing Tips

### Root Cause Analysis
Use the **5 Whys** technique:
1. Why did the app crash? → Database connection failed
2. Why did connection fail? → Connection pool exhausted
3. Why was pool exhausted? → No connection release after queries
4. Why weren't connections released? → Missing `finally` blocks
5. Why were finally blocks missing? → Not in coding standards

**Root Cause**: Coding standards didn't enforce connection cleanup

### Effort Tracking
- Track time spent on each activity (investigation, coding, testing)
- Include context-switching time
- Note interruptions and blockers
- Compare estimate vs actual
- Learn from variances

### Writing for Future You
Ask yourself:
- What context would I need if I saw this again in 6 months?
- What debugging steps saved time?
- What resources were most helpful?
- What would I do differently?

## Maintenance Schedule

### Weekly Review (15 min)
- Review all pending issues/tasks
- Update status and priorities
- Close or archive stale items

### Monthly Retrospective (1 hour)
- Analyze common issue patterns
- Review effort estimates vs actuals
- Update templates based on learnings
- Extract patterns into CLAUDE.md

### Quarterly Audit (2 hours)
- Clean up old pending items
- Archive completed journals (>3 months old)
- Extract recurring patterns
- Update skills.md if needed

---

# Appendix

## Template Quick Links

- [Pending Issue](#pending-issue-template)
- [Completed Issue](#completed-issue-template)
- [Issue Journal](#issue-journal-template)
- [Pending Task](#pending-task-template)
- [Completed Task](#completed-task-template)
- [Task Journal](#task-journal-template)

## Issue vs Task - When to Use What?

**Use Issue When**:
- Something is broken or not working correctly
- There's an error, bug, or defect
- Existing functionality needs fixing
- It's reactive (responding to a problem)

**Use Task When**:
- Building new functionality
- Enhancing existing features
- Refactoring code
- Writing documentation
- It's proactive (planned work)

**Gray Area?** Use Task by default.

## File Naming Examples

### Good ✓
- `issue-001-jwt-token-expiry-bug.md`
- `task-005-add-dark-mode-toggle.md`
- `issue-023-mobile-crash-on-logout.md`

### Bad ✗
- `bug.md` (no number, too vague)
- `issue-1-fix.md` (number not padded, not descriptive)
- `my-task.md` (no number, unclear)

## Useful Emoji Indicators

Use in journals/notes (optional):
- ✅ Completed / Success
- ❌ Failed / Error
- ⚠️ Warning / Caution
- 🔥 Critical / Urgent
- 💡 Idea / Insight
- 🐛 Bug
- ✨ New Feature
- 🔧 Fix / Repair
- 📝 Documentation
- 🚀 Deployment
- ⏱️ Performance
- 🔒 Security

---

**Document Version**: 2.0
**Last Updated**: 2026-02-15
**Maintained By**: Development Team
**Changes from v1.0**: Simplified templates, added quick reference, fixed directory structure, improved organization
