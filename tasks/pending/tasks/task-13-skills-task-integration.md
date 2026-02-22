# Task 13: Skills-Task Integration

**Issue**: #4 - Skills Tracking Feature
**ClickUp**: https://app.clickup.com/t/86d1z2736
**Priority**: ✨ Medium (New Feature)
**Estimated Time**: 1 day
**Sprint**: Sprint 3 (Week 3)

---

## Objective
Integrate skills tracking with the existing task system, allowing users to tag tasks with skills and automatically update skill usage data.

## Dependencies

- ✅ Task 10, 11, 12 completed (skills system fully functional)

## Features to Implement

### 1. Skill Selector in Add/Edit Task Modal
### 2. Skill Badges on Task Cards
### 3. Auto-update `last_used` on Task Completion
### 4. View Tasks by Skill

## Implementation Steps

### 1. Create Skill Selector Component
**File**: `frontend-web/src/components/SkillSelector.jsx` (new file)

```jsx
import React, { useState, useEffect } from 'react';
import { Award, X, Plus } from 'lucide-react';
import api from '../api';
import './SkillSelector.css';

const SkillSelector = ({ selectedSkills = [], onChange, label = 'Skills' }) => {
    const [availableSkills, setAvailableSkills] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadSkills();
    }, []);

    const loadSkills = async () => {
        try {
            const skills = await api.skills.getAll();
            setAvailableSkills(skills);
        } catch (error) {
            console.error('Failed to load skills:', error);
        }
    };

    const handleAddSkill = (skillId) => {
        if (!selectedSkills.includes(skillId)) {
            onChange([...selectedSkills, skillId]);
        }
        setSearchQuery('');
        setIsDropdownOpen(false);
    };

    const handleRemoveSkill = (skillId) => {
        onChange(selectedSkills.filter(id => id !== skillId));
    };

    const filteredSkills = availableSkills.filter(skill =>
        !selectedSkills.includes(skill.id) &&
        skill.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedSkillObjects = availableSkills.filter(skill =>
        selectedSkills.includes(skill.id)
    );

    return (
        <div className="skill-selector">
            <label>{label}</label>

            {/* Selected Skills */}
            <div className="selected-skills">
                {selectedSkillObjects.map(skill => (
                    <div key={skill.id} className="skill-chip">
                        <Award size={14} />
                        <span>{skill.name}</span>
                        <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill.id)}
                            className="remove-skill"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}

                {/* Add Button */}
                <button
                    type="button"
                    className="add-skill-btn"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    <Plus size={16} />
                    Add Skill
                </button>
            </div>

            {/* Dropdown */}
            {isDropdownOpen && (
                <div className="skill-dropdown">
                    <input
                        type="text"
                        placeholder="Search skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />

                    <div className="skill-list">
                        {filteredSkills.map(skill => (
                            <div
                                key={skill.id}
                                className="skill-option"
                                onClick={() => handleAddSkill(skill.id)}
                            >
                                <Award size={14} />
                                <span>{skill.name}</span>
                                <span className="skill-proficiency">
                                    {skill.proficiency_level}
                                </span>
                            </div>
                        ))}

                        {filteredSkills.length === 0 && (
                            <div className="no-skills">
                                No skills found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillSelector;
```

### 2. Update AddTaskModal/EditTaskModal
**File**: `frontend-web/src/components/AddTaskModal.jsx` (update)

Add skill selector to task creation:

```jsx
import SkillSelector from './SkillSelector';

const AddTaskModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        // ... existing fields
        skills: [] // Add skills field
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Create task
            const task = await api.tasks.create(formData);

            // Link skills
            for (const skillId of formData.skills) {
                await api.skills.linkToTask(skillId, task.id);
            }

            onSuccess();
        } catch (error) {
            // handle error
        }
    };

    return (
        <div className="modal-content">
            {/* ... existing form fields ... */}

            <div className="form-group">
                <SkillSelector
                    selectedSkills={formData.skills}
                    onChange={(skills) => setFormData({ ...formData, skills })}
                    label="Skills (what you'll practice)"
                />
            </div>

            {/* ... rest of form ... */}
        </div>
    );
};
```

### 3. Update Task Card to Show Skills
**File**: `frontend-web/src/components/Tasks.jsx` (update)

Add skills display to task cards:

```jsx
// In task card rendering:
const TaskCard = ({ task }) => {
    const [taskSkills, setTaskSkills] = useState([]);

    useEffect(() => {
        if (task.id) {
            loadTaskSkills();
        }
    }, [task.id]);

    const loadTaskSkills = async () => {
        try {
            const skills = await api.tasks.getSkills(task.id);
            setTaskSkills(skills);
        } catch (error) {
            console.error('Failed to load skills:', error);
        }
    };

    return (
        <div className="task-card">
            {/* ... existing task card content ... */}

            {taskSkills.length > 0 && (
                <div className="task-skills">
                    {taskSkills.map(skill => (
                        <span key={skill.id} className="task-skill-badge">
                            🌱 {skill.name}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};
```

### 4. Auto-Update Skills on Task Completion
**File**: `backend/routes/tasks.js` (update)

Add skill update logic to task completion:

```javascript
// In PUT /:id endpoint, after successful task update
if (completed === true || status === 'DONE') {
    // Update linked skills' last_used date
    await db.query(`
        UPDATE skills
        SET last_used = CURRENT_DATE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id IN (
            SELECT skill_id
            FROM task_skills
            WHERE task_id = $1
        )
        AND user_id = $2
    `, [id, req.userId]);
}
```

### 5. Add Get Task Skills Endpoint
**File**: `backend/routes/tasks.js` (update)

```javascript
// Get skills for a task
router.get('/:id/skills', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
            SELECT s.*
            FROM skills s
            JOIN task_skills ts ON s.id = ts.skill_id
            WHERE ts.task_id = $1 AND s.user_id = $2
            ORDER BY s.name ASC
        `, [id, req.userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching task skills:', err);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
});
```

### 6. Update API Client
**File**: `frontend-web/src/api.js` (update)

```javascript
const api = {
    tasks: {
        // ... existing methods ...

        getSkills: async (taskId) => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/tasks/${taskId}/skills`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch task skills');
            return response.json();
        }
    }
};
```

### 7. Add Skills Filter to Tasks Page
**File**: `frontend-web/src/components/Tasks.jsx` (update)

Add skill-based filtering:

```jsx
const Tasks = () => {
    const [skillFilter, setSkillFilter] = useState(null);
    const [userSkills, setUserSkills] = useState([]);

    useEffect(() => {
        loadUserSkills();
    }, []);

    const loadUserSkills = async () => {
        try {
            const skills = await api.skills.getAll();
            setUserSkills(skills);
        } catch (error) {
            console.error('Failed to load skills:', error);
        }
    };

    const filteredTasks = tasks.filter(task => {
        // ... existing filters ...

        if (skillFilter) {
            // Check if task has this skill linked
            // (would need to load task-skill mappings)
            return taskSkillMap[task.id]?.includes(skillFilter);
        }

        return true;
    });

    return (
        <div className="tasks-page">
            {/* Add skill filter dropdown */}
            <select
                value={skillFilter || ''}
                onChange={(e) => setSkillFilter(e.target.value || null)}
            >
                <option value="">All Skills</option>
                {userSkills.map(skill => (
                    <option key={skill.id} value={skill.id}>
                        {skill.name}
                    </option>
                ))}
            </select>

            {/* ... rest of tasks UI ... */}
        </div>
    );
};
```

### 8. Add CSS Styles
**File**: `frontend-web/src/components/SkillSelector.css`

```css
.skill-selector {
    margin-bottom: 16px;
}

.skill-selector label {
    display: block;
    margin-bottom: 8px;
    color: var(--nds-text-primary);
    font-weight: 500;
}

.selected-skills {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    padding: 12px;
    background: var(--nds-bg-secondary);
    border-radius: 8px;
    min-height: 50px;
}

.skill-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba(96, 165, 250, 0.2);
    border: 1px solid rgba(96, 165, 250, 0.4);
    border-radius: 16px;
    color: #60a5fa;
    font-size: 0.85rem;
}

.remove-skill {
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    padding: 2px;
    display: flex;
    align-items: center;
}

.remove-skill:hover {
    opacity: 0.7;
}

.add-skill-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: transparent;
    border: 1px dashed var(--nds-border);
    border-radius: 16px;
    color: var(--nds-text-secondary);
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s ease;
}

.add-skill-btn:hover {
    border-color: var(--nds-primary);
    color: var(--nds-primary);
}

.skill-dropdown {
    position: relative;
    margin-top: 8px;
    background: var(--nds-bg-tertiary);
    border: 1px solid var(--nds-border);
    border-radius: 8px;
    padding: 8px;
    max-height: 300px;
    overflow-y: auto;
}

.skill-dropdown input {
    width: 100%;
    padding: 8px 12px;
    background: var(--nds-bg-secondary);
    border: 1px solid var(--nds-border);
    border-radius: 6px;
    color: var(--nds-text-primary);
    margin-bottom: 8px;
}

.skill-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.skill-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: var(--nds-bg-secondary);
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s ease;
}

.skill-option:hover {
    background: var(--nds-bg-hover);
}

.skill-proficiency {
    margin-left: auto;
    font-size: 0.75rem;
    color: var(--nds-text-secondary);
}

.task-skills {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 8px;
}

.task-skill-badge {
    padding: 4px 8px;
    background: rgba(96, 165, 250, 0.15);
    border: 1px solid rgba(96, 165, 250, 0.3);
    border-radius: 12px;
    font-size: 0.75rem;
    color: #60a5fa;
}
```

## Testing Checklist

- [ ] Skill selector loads all user skills
- [ ] Can add multiple skills to task
- [ ] Can remove skills from task
- [ ] Skills save when creating task
- [ ] Skills display on task cards
- [ ] Completing task updates skill `last_used` date
- [ ] Filter tasks by skill works
- [ ] Skill search in selector works
- [ ] Mobile-friendly skill selector

## Success Criteria

✅ Skills can be added to tasks via selector
✅ Task cards display linked skills
✅ Task completion updates skill usage data
✅ Can filter tasks by skill
✅ Skill selector is user-friendly
✅ Auto-tracking works seamlessly

## Files Created/Modified

**New Files:**
- `frontend-web/src/components/SkillSelector.jsx`
- `frontend-web/src/components/SkillSelector.css`

**Modified:**
- `frontend-web/src/components/AddTaskModal.jsx`
- `frontend-web/src/components/Tasks.jsx`
- `frontend-web/src/components/Tasks.css`
- `backend/routes/tasks.js`
- `frontend-web/src/api.js`

## Sprint 3 Complete! 🎉

All skills tracking features implemented and integrated with task system.

## Related Tasks

← [Task 12: Skills Frontend Components](task-12-skills-frontend-components.md)
→ Sprint 4: UI Polish (Tasks 03-05)
