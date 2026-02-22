# Task 12: Skills Frontend Components

**Issue**: #4 - Skills Tracking Feature
**ClickUp**: https://app.clickup.com/t/86d1z2736
**Priority**: ✨ Medium (New Feature)
**Estimated Time**: 2 days
**Sprint**: Sprint 3 (Week 3)

---

## Objective
Create frontend UI components for managing skills, including a dashboard page, skill cards, and modal forms.

## Dependencies

- ✅ Task 10, 11 completed (backend fully functional)

## Components to Create

### 1. SkillsPage - Main dashboard
### 2. SkillCard - Individual skill display
### 3. AddSkillModal - Create new skills
### 4. EditSkillModal - Edit existing skills

## Implementation Steps

### 1. Create Skills Page
**File**: `frontend-web/src/components/SkillsPage.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Award, Target, Search, Filter } from 'lucide-react';
import { Button, Input } from '../design-system';
import SkillCard from './SkillCard';
import AddSkillModal from './AddSkillModal';
import api from '../api';
import './SkillsPage.css';

const CATEGORIES = ['ALL', 'TECHNICAL', 'LANGUAGE', 'SOFT_SKILLS', 'CREATIVE', 'BUSINESS', 'OTHER'];

const SkillsPage = () => {
    const [skills, setSkills] = useState([]);
    const [stats, setStats] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSkills();
        loadStats();
    }, [categoryFilter, searchQuery]);

    const loadSkills = async () => {
        setIsLoading(true);
        try {
            const params = {};
            if (categoryFilter !== 'ALL') params.category = categoryFilter;
            if (searchQuery) params.search = searchQuery;

            const data = await api.skills.getAll(params);
            setSkills(data);
        } catch (error) {
            console.error('Failed to load skills:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const data = await api.skills.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const handleSkillCreated = () => {
        setIsAddModalOpen(false);
        loadSkills();
        loadStats();
    };

    const handleSkillUpdated = () => {
        loadSkills();
        loadStats();
    };

    return (
        <div className="skills-page">
            <div className="skills-header">
                <div className="skills-title">
                    <Award size={28} />
                    <h1>Skills Dashboard</h1>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <Plus size={16} /> Add Skill
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="skills-stats">
                    <div className="stat-card">
                        <Award size={24} style={{ color: '#fbbf24' }} />
                        <div className="stat-content">
                            <div className="stat-value">{stats.total_skills}</div>
                            <div className="stat-label">Total Skills</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <Target size={24} style={{ color: '#4ade80' }} />
                        <div className="stat-content">
                            <div className="stat-value">{stats.expert}</div>
                            <div className="stat-label">Expert Level</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <TrendingUp size={24} style={{ color: '#60a5fa' }} />
                        <div className="stat-content">
                            <div className="stat-value">{stats.beginner}</div>
                            <div className="stat-label">Learning</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <Filter size={24} style={{ color: '#a78bfa' }} />
                        <div className="stat-content">
                            <div className="stat-value">{stats.used_last_month}</div>
                            <div className="stat-label">Active (30d)</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="skills-search">
                <Search size={20} />
                <Input
                    type="text"
                    placeholder="Search skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Category Filter */}
            <div className="category-filters">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        className={`category-pill ${categoryFilter === cat ? 'active' : ''}`}
                        onClick={() => setCategoryFilter(cat)}
                    >
                        {cat.replace('_', ' ')}
                        {stats && cat !== 'ALL' && ` (${stats[cat.toLowerCase()] || 0})`}
                    </button>
                ))}
            </div>

            {/* Skills Grid */}
            {isLoading ? (
                <div className="skills-loading">Loading skills...</div>
            ) : (
                <div className="skills-grid">
                    {skills.map(skill => (
                        <SkillCard
                            key={skill.id}
                            skill={skill}
                            onUpdate={handleSkillUpdated}
                        />
                    ))}
                </div>
            )}

            {!isLoading && skills.length === 0 && (
                <div className="skills-empty">
                    <Award size={64} />
                    <h3>No skills found</h3>
                    <p>Start tracking your skills to see your progress over time</p>
                    <Button
                        variant="primary"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        Add Your First Skill
                    </Button>
                </div>
            )}

            {isAddModalOpen && (
                <AddSkillModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={handleSkillCreated}
                />
            )}
        </div>
    );
};

export default SkillsPage;
```

### 2. Create Skill Card Component
**File**: `frontend-web/src/components/SkillCard.jsx`

```jsx
import React, { useState } from 'react';
import { CheckCircle, Clock, TrendingUp, Edit2, Trash2, Link as LinkIcon } from 'lucide-react';
import './SkillCard.css';

const PROFICIENCY_CONFIG = {
    BEGINNER: { color: '#94a3b8', emoji: '🌱', label: 'Beginner', width: '25%' },
    INTERMEDIATE: { color: '#60a5fa', emoji: '🌿', label: 'Intermediate', width: '50%' },
    ADVANCED: { color: '#a78bfa', emoji: '🌳', label: 'Advanced', width: '75%' },
    EXPERT: { color: '#fbbf24', emoji: '⭐', label: 'Expert', width: '100%' }
};

const SkillCard = ({ skill, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const config = PROFICIENCY_CONFIG[skill.proficiency_level] || PROFICIENCY_CONFIG.BEGINNER;

    const handleProficiencyChange = async () => {
        const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
        const currentIndex = levels.indexOf(skill.proficiency_level);
        const nextLevel = levels[(currentIndex + 1) % levels.length];

        try {
            await api.skills.updateProficiency(skill.id, nextLevel);
            onUpdate();
        } catch (error) {
            console.error('Failed to update proficiency:', error);
        }
    };

    const handleDelete = async () => {
        if (confirm(`Delete skill "${skill.name}"?`)) {
            try {
                await api.skills.delete(skill.id);
                onUpdate();
            } catch (error) {
                console.error('Failed to delete skill:', error);
            }
        }
    };

    return (
        <div className="skill-card">
            <div className="skill-card-header">
                <div className="skill-emoji">{config.emoji}</div>
                <div className="skill-info">
                    <h3>{skill.name}</h3>
                    <span className="skill-category">{skill.category}</span>
                </div>
                <div className="skill-actions">
                    <button className="btn-icon" onClick={() => setIsEditing(true)}>
                        <Edit2 size={16} />
                    </button>
                    <button className="btn-icon btn-danger" onClick={handleDelete}>
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="skill-proficiency">
                <div className="proficiency-bar" onClick={handleProficiencyChange} style={{ cursor: 'pointer' }}>
                    <div
                        className="proficiency-fill"
                        style={{
                            width: config.width,
                            background: config.color
                        }}
                    />
                </div>
                <span style={{ color: config.color, fontSize: '0.9rem' }}>
                    {config.label}
                </span>
            </div>

            {skill.description && (
                <p className="skill-description">{skill.description}</p>
            )}

            <div className="skill-stats">
                <div className="skill-stat">
                    <CheckCircle size={14} />
                    <span>{skill.linked_tasks || 0} tasks</span>
                </div>
                <div className="skill-stat">
                    <LinkIcon size={14} />
                    <span>{skill.linked_sessions || 0} sessions</span>
                </div>
                <div className="skill-stat">
                    <Clock size={14} />
                    <span>{Math.round(skill.total_hours_practiced || 0)}h</span>
                </div>
            </div>

            {skill.tags?.length > 0 && (
                <div className="skill-tags">
                    {skill.tags.map(tag => (
                        <span key={tag} className="skill-tag">{tag}</span>
                    ))}
                </div>
            )}

            {skill.last_used && (
                <div className="skill-last-used">
                    Last used: {new Date(skill.last_used).toLocaleDateString()}
                </div>
            )}
        </div>
    );
};

export default SkillCard;
```

### 3. Create Add Skill Modal
**File**: `frontend-web/src/components/AddSkillModal.jsx`

```jsx
import React, { useState } from 'react';
import { X, Award } from 'lucide-react';
import { Button, Input } from '../design-system';
import api from '../api';
import './AddSkillModal.css';

const CATEGORIES = ['TECHNICAL', 'LANGUAGE', 'SOFT_SKILLS', 'CREATIVE', 'BUSINESS', 'OTHER'];
const PROFICIENCY_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

const AddSkillModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: 'TECHNICAL',
        proficiency_level: 'BEGINNER',
        description: '',
        tags: '',
        date_acquired: new Date().toISOString().split('T')[0]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) {
            setError('Skill name is required');
            return;
        }

        setIsSubmitting(true);

        try {
            const skillData = {
                ...formData,
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
            };

            await api.skills.create(skillData);
            onSuccess();
        } catch (err) {
            setError(err.message || 'Failed to create skill');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content skill-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title">
                        <Award size={24} />
                        <h2>Add New Skill</h2>
                    </div>
                    <button className="btn-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Skill Name *</label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., JavaScript, Spanish, Public Speaking"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat.replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Proficiency Level</label>
                            <select
                                value={formData.proficiency_level}
                                onChange={(e) => setFormData({ ...formData, proficiency_level: e.target.value })}
                            >
                                {PROFICIENCY_LEVELS.map(level => (
                                    <option key={level} value={level}>
                                        {level}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe your experience with this skill..."
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label>Tags (comma-separated)</label>
                        <Input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            placeholder="e.g., frontend, react, web"
                        />
                    </div>

                    <div className="form-group">
                        <label>Date Acquired</label>
                        <Input
                            type="date"
                            value={formData.date_acquired}
                            onChange={(e) => setFormData({ ...formData, date_acquired: e.target.value })}
                        />
                    </div>

                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    <div className="modal-actions">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add Skill'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSkillModal;
```

### 4. Create CSS Styles
**File**: `frontend-web/src/components/SkillsPage.css`

```css
.skills-page {
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
}

.skills-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.skills-title {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--nds-text-primary);
}

.skills-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 30px;
}

.stat-card {
    background: var(--nds-bg-secondary);
    padding: 20px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: var(--nds-shadow-sm);
}

.stat-content {
    flex: 1;
}

.stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--nds-text-primary);
}

.stat-label {
    font-size: 0.9rem;
    color: var(--nds-text-secondary);
}

.skills-search {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--nds-bg-secondary);
    border-radius: 12px;
    margin-bottom: 20px;
}

.category-filters {
    display: flex;
    gap: 12px;
    margin-bottom: 30px;
    flex-wrap: wrap;
}

.category-pill {
    padding: 8px 16px;
    background: var(--nds-bg-secondary);
    border: 1px solid var(--nds-border);
    border-radius: 20px;
    color: var(--nds-text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
}

.category-pill:hover {
    background: var(--nds-bg-tertiary);
}

.category-pill.active {
    background: var(--nds-primary);
    color: white;
    border-color: var(--nds-primary);
}

.skills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
}

.skills-empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--nds-text-secondary);
}

.skills-empty svg {
    opacity: 0.3;
    margin-bottom: 20px;
}

@media (max-width: 768px) {
    .skills-grid {
        grid-template-columns: 1fr;
    }
}
```

**File**: `frontend-web/src/components/SkillCard.css`

```css
.skill-card {
    background: var(--nds-bg-secondary);
    padding: 20px;
    border-radius: 12px;
    box-shadow: var(--nds-shadow-md);
    transition: transform 0.2s ease;
}

.skill-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--nds-shadow-lg);
}

.skill-card-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
}

.skill-emoji {
    font-size: 2rem;
}

.skill-info {
    flex: 1;
}

.skill-info h3 {
    margin: 0 0 4px 0;
    color: var(--nds-text-primary);
}

.skill-category {
    font-size: 0.8rem;
    color: var(--nds-text-secondary);
    text-transform: capitalize;
}

.skill-actions {
    display: flex;
    gap: 8px;
}

.btn-icon {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    color: var(--nds-text-secondary);
    transition: all 0.2s ease;
}

.btn-icon:hover {
    background: var(--nds-bg-tertiary);
    color: var(--nds-text-primary);
}

.btn-danger:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

.skill-proficiency {
    margin-bottom: 16px;
}

.proficiency-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
}

.proficiency-fill {
    height: 100%;
    transition: width 0.3s ease;
    border-radius: 4px;
}

.skill-description {
    font-size: 0.9rem;
    color: var(--nds-text-secondary);
    margin-bottom: 16px;
    line-height: 1.5;
}

.skill-stats {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;
}

.skill-stat {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    color: var(--nds-text-secondary);
}

.skill-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.skill-tag {
    padding: 4px 10px;
    background: rgba(96, 165, 250, 0.15);
    border: 1px solid rgba(96, 165, 250, 0.3);
    border-radius: 12px;
    font-size: 0.75rem;
    color: #60a5fa;
}

.skill-last-used {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--nds-border);
    font-size: 0.8rem;
    color: var(--nds-text-secondary);
}
```

## Testing Checklist

- [ ] Skills page loads and displays skills
- [ ] Stats cards show correct counts
- [ ] Category filtering works
- [ ] Search filters skills
- [ ] Add skill modal creates new skills
- [ ] Skill card displays all information
- [ ] Click proficiency bar cycles levels
- [ ] Edit skill opens modal (if implemented)
- [ ] Delete skill works with confirmation
- [ ] Empty state shows when no skills
- [ ] Mobile responsive design
- [ ] Skill tags render correctly

## Success Criteria

✅ Full skills dashboard functional
✅ CRUD operations work via UI
✅ Proficiency can be updated with click
✅ Statistics display correctly
✅ Search and filtering work
✅ Mobile-friendly layout
✅ Matches design system styling

## Files Created

- `frontend-web/src/components/SkillsPage.jsx`
- `frontend-web/src/components/SkillsPage.css`
- `frontend-web/src/components/SkillCard.jsx`
- `frontend-web/src/components/SkillCard.css`
- `frontend-web/src/components/AddSkillModal.jsx`
- `frontend-web/src/components/AddSkillModal.css`

## Next Task

→ [Task 13: Skills-Task Integration](task-13-skills-task-integration.md)
