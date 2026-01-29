// =============================================
// Universal Study Tracker - API Integration
// =============================================

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Global State
let currentSubject = null;
let subjects = [];
let studyTopics = [];
let studySessions = [];
let revisionItems = [];

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    await loadSubjects();
    initializeEventListeners();
});

function initializeEventListeners() {
    const selector = document.getElementById('subject-selector');
    if (selector) {
        selector.addEventListener('change', async (e) => {
            const subjectId = e.target.value;
            if (subjectId) {
                await loadSubject(parseInt(subjectId));
            }
        });
    }
}

// =============================================
// SUBJECTS API
// =============================================

async function loadSubjects() {
    try {
        const response = await fetch(`${API_BASE_URL}/subjects`);
        if (!response.ok) throw new Error('Failed to load subjects');
        
        subjects = await response.json();
        updateSubjectSelector();
        
        // Load first subject if available
        if (subjects.length > 0) {
            await loadSubject(subjects[0].id);
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
        showNotification('Failed to load subjects', 'error');
    }
}

function updateSubjectSelector() {
    const selector = document.getElementById('subject-selector');
    if (!selector) return;
    
    selector.innerHTML = '';
    
    if (subjects.length === 0) {
        selector.innerHTML = '<option value="">No subjects - Create one!</option>';
        return;
    }
    
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        if (subject.topic_count) {
            option.textContent += ` (${subject.completed_count}/${subject.topic_count})`;
        }
        selector.appendChild(option);
    });
    
    // Select current subject
    if (currentSubject) {
        selector.value = currentSubject.id;
    }
}

async function loadSubject(subjectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}`);
        if (!response.ok) throw new Error('Failed to load subject');
        
        const data = await response.json();
        currentSubject = data.subject;
        studyTopics = data.topics || [];
        studySessions = data.sessions || [];
        revisionItems = data.revisionItems || [];
        
        updateUI();
    } catch (error) {
        console.error('Error loading subject:', error);
        showNotification('Failed to load subject data', 'error');
    }
}

function updateUI() {
    if (!currentSubject) return;
    
    // Update header
    document.getElementById('subject-name').textContent = currentSubject.name;
    document.getElementById('subject-description').textContent = currentSubject.description || 'Study Progress Tracker';
    document.getElementById('subject-icon').textContent = currentSubject.icon;
    document.title = `${currentSubject.name} - Study Tracker`;
    
    // Update statistics
    updateStatistics();
    
    // Update summary
    updateSummary();
    
    // Update topics checklist
    initializeTopicsChecklist();
    
    // Update timeline
    updateTimeline();
    
    // Update timesheet
    updateTimesheet();
    
    // Update revision tracker
    renderRevisionItems();
}

// =============================================
// TAB SWITCHING
// =============================================

function switchTab(tabName) {
    // Remove active class from all tabs and buttons
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to selected tab and button
    const selectedTab = document.getElementById(`${tabName}-tab`);
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedBtn) selectedBtn.classList.add('active');
}

// =============================================
// SUMMARY UPDATES
// =============================================

function updateSummary() {
    const totalTopics = studyTopics.length;
    const completedTopics = studyTopics.filter(t => t.completed).length;
    const totalRevisions = revisionItems.reduce((sum, item) => sum + item.revision_count, 0);
    const totalSessions = studySessions.length;
    
    const summaryTopics = document.getElementById('summary-topics');
    const summaryCompleted = document.getElementById('summary-completed');
    const summaryRevisions = document.getElementById('summary-revisions');
    const summarySessions = document.getElementById('summary-sessions');
    
    if (summaryTopics) summaryTopics.textContent = `${totalTopics} topics`;
    if (summaryCompleted) summaryCompleted.textContent = `${completedTopics} out of ${totalTopics} topics completed`;
    if (summaryRevisions) summaryRevisions.textContent = `${totalRevisions} total revisions`;
    if (summarySessions) summarySessions.textContent = `${totalSessions} study sessions recorded`;
}

// =============================================
// CREATE SUBJECT MODAL
// =============================================

function showCreateSubjectModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">Create New Subject</h2>
                <button class="modal-close" onclick="closeModal(this)">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Subject Name *</label>
                    <input type="text" id="subject-name-input" class="form-input" placeholder="e.g., AWS Developer, Docker, Python" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea id="subject-description-input" class="form-textarea" placeholder="What are you learning?"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Choose Icon</label>
                    <div class="icon-picker">
                        ${['☁️', '🐳', '🐍', '💛', '⚛️', '🟢', '🍃', '🐘', '🔥', '📚', '💻', '🚀', '⚡', '🎯', '🌟', '💡'].map(icon => 
                            `<div class="icon-option" onclick="selectIcon(this, '${icon}')">${icon}</div>`
                        ).join('')}
                    </div>
                    <input type="hidden" id="selected-icon" value="📚">
                </div>
                <div class="form-group">
                    <label class="form-label">Choose Color</label>
                    <div class="color-picker">
                        ${['#FF9900', '#2496ED', '#3776AB', '#F7DF1E', '#61DAFB', '#339933', '#47A248', '#336791', '#ff6b35', '#4ecdc4', '#ffd23f', '#06d6a0'].map(color => 
                            `<div class="color-option" style="background: ${color}" onclick="selectColor(this, '${color}')"></div>`
                        ).join('')}
                    </div>
                    <input type="hidden" id="selected-color" value="#3b82f6">
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: var(--glass-bg); border-radius: var(--radius-md);">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" id="seed-aws-topics" style="width: 20px; height: 20px;">
                        <span>Seed with AWS topics (15 pre-defined topics)</span>
                    </label>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal(this)">Cancel</button>
                <button class="btn btn-primary" onclick="createSubject()">Create Subject</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Focus on name input
    setTimeout(() => document.getElementById('subject-name-input').focus(), 100);
}

function selectIcon(element, icon) {
    document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    document.getElementById('selected-icon').value = icon;
}

function selectColor(element, color) {
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    document.getElementById('selected-color').value = color;
}

function closeModal(button) {
    const modal = button.closest('.modal-overlay');
    modal.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => modal.remove(), 300);
}

async function createSubject() {
    const name = document.getElementById('subject-name-input').value.trim();
    const description = document.getElementById('subject-description-input').value.trim();
    const icon = document.getElementById('selected-icon').value;
    const color = document.getElementById('selected-color').value;
    const seedAWS = document.getElementById('seed-aws-topics').checked;
    
    if (!name) {
        showNotification('Please enter a subject name', 'error');
        return;
    }
    
    try {
        // Create subject
        const response = await fetch(`${API_BASE_URL}/subjects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, icon, color })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create subject');
        }
        
        const newSubject = await response.json();
        showNotification(`Created subject: ${name}`, 'success');
        
        // Seed AWS topics if requested
        if (seedAWS) {
            const seedResponse = await fetch(`${API_BASE_URL}/progress/seed/${newSubject.id}`, {
                method: 'POST'
            });
            
            if (seedResponse.ok) {
                showNotification('AWS topics added successfully', 'success');
            }
        }
        
        // Close modal
        closeModal(document.querySelector('.modal-close'));
        
        // Reload subjects and select the new one
        await loadSubjects();
        await loadSubject(newSubject.id);
        document.getElementById('subject-selector').value = newSubject.id;
        
    } catch (error) {
        console.error('Error creating subject:', error);
        showNotification(error.message, 'error');
    }
}

// =============================================
// TOPICS API
// =============================================

function initializeTopicsChecklist() {
    const container = document.getElementById('topics-checklist');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (studyTopics.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><p>No topics yet. Create one or seed AWS topics!</p></div>';
        return;
    }
    
    studyTopics.forEach(topic => {
        const topicItem = document.createElement('div');
        topicItem.className = `topic-item ${topic.completed ? 'completed' : ''}`;
        topicItem.innerHTML = `
            <input type="checkbox" 
                   class="topic-checkbox" 
                   ${topic.completed ? 'checked' : ''}
                   onchange="toggleTopic(${topic.id}, this.checked)">
            <span class="topic-label">${topic.name}</span>
            <span class="topic-category">${topic.category}</span>
        `;
        container.appendChild(topicItem);
    });
}

async function toggleTopic(topicId, completed) {
    try {
        const response = await fetch(`${API_BASE_URL}/progress/topics/${topicId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed })
        });
        
        if (!response.ok) throw new Error('Failed to update topic');
        
        // Update local state
        const topic = studyTopics.find(t => t.id === topicId);
        if (topic) {
            topic.completed = completed;
            updateStatistics();
            showNotification(completed ? '✅ Topic completed!' : '📝 Topic marked incomplete', 'success');
        }
    } catch (error) {
        console.error('Error updating topic:', error);
        showNotification('Failed to update topic', 'error');
        // Reload to sync state
        await loadSubject(currentSubject.id);
    }
}

// =============================================
// STATISTICS
// =============================================

function updateStatistics() {
    if (!currentSubject || studyTopics.length === 0) return;
    
    const completedTopics = studyTopics.filter(t => t.completed).length;
    const totalTopics = studyTopics.length;
    const  progress = Math.round((completedTopics / totalTopics) * 100);
    
    // Update header stats
    document.getElementById('completed-topics').textContent = completedTopics;
    document.getElementById('topics-completed').textContent = `${completedTopics}/${totalTopics}`;
    document.getElementById('exam-readiness').textContent = `${progress}%`;
    document.getElementById('overall-progress').textContent = `${progress}%`;
    
    // Update progress bars in overview
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
}

// =============================================
// TIMELINE
// =============================================

function updateTimeline() {
    const timeline = document.getElementById('study-timeline');
    if (!timeline) return;
    
    timeline.innerHTML = '';
    
    if (studySessions.length === 0) {
        timeline.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><p class="empty-state-title">No study sessions yet</p><p class="empty-state-message">Click "Add Study Session" to start tracking your progress</p></div>';
        return;
    }
    
    studySessions.forEach(session => {
        const item = createTimelineItem(session);
        timeline.appendChild(item);
    });
}

function createTimelineItem(session) {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    
    const date = new Date(session.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    });
    
    item.innerHTML = `
        <div class="timeline-date">📅 ${formattedDate}</div>
        <div class="timeline-content">
            <h4 class="timeline-title">${session.activity}</h4>
            ${session.time_spent ? `<p style="color: var(--text-secondary);">Duration: ${session.time_spent} minutes</p>` : ''}
            ${session.topics_covered ? `
                <div style="margin-top: 1rem;">
                    <strong style="color: var(--color-accent);">Topics Covered:</strong>
                    <p style="color: var(--text-secondary); margin-top: 0.5rem;">${session.topics_covered}</p>
                </div>
            ` : ''}
            ${session.notes ? `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--glass-border);">
                    <strong style="color: var(--color-success);">📝 Notes:</strong>
                    <p style="color: var(--text-secondary); margin-top: 0.5rem;">${session.notes}</p>
                </div>
            ` : ''}
        </div>
    `;
    
    return item;
}

// =============================================
// REVISION TRACKER
// =============================================

function renderRevisionItems() {
    const container = document.getElementById('revision-tracker');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (revisionItems.length === 0) {
        container.innerHTML = '<div class="revision-empty"><div class="revision-empty-icon">🔄</div><p>No revision items yet. Click "Add Item" to start tracking!</p></div>';
        return;
    }
    
    revisionItems.forEach(item => {
        const revisionItem = createRevisionItem(item);
        container.appendChild(revisionItem);
    });
}

function createRevisionItem(item) {
    const div = document.createElement('div');
    div.className = 'revision-item';
    div.setAttribute('data-revision-count', item.revision_count);
    
    const lastRevised = item.last_revised 
        ? new Date(item.last_revised).toLocaleDateString() 
        : 'Never';
    
    div.innerHTML = `
        <div class="revision-badge" data-count="${item.revision_count}">${item.revision_count}</div>
        <div>
            <div style="font-weight: 600; color: var(--text-primary);">${item.title}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">
                ${item.category || 'General'} • Last: ${lastRevised}
            </div>
        </div>
        <button class="btn-icon btn-success" onclick="markAsRevised(${item.id})" title="Mark as Revised">
            <span>✓</span>
        </button>
        <button class="btn-icon btn-danger" onclick="deleteRevisionItem(${item.id})" title="Delete">
            <span>🗑️</span>
        </button>
    `;
    
    return div;
}

async function markAsRevised(itemId) {
    try {
        const response = await fetch(`${API_BASE_URL}/progress/revisions/${itemId}`, {
            method: 'PUT'
        });
        
        if (!response.ok) throw new Error('Failed to mark as revised');
        
        showNotification('✅ Marked as revised!', 'success');
        await loadSubject(currentSubject.id);
    } catch (error) {
        console.error('Error marking as revised:', error);
        showNotification('Failed to update revision', 'error');
    }
}

async function deleteRevisionItem(itemId) {
    if (!confirm('Delete this revision item?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/progress/revisions/${itemId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete revision');
        
        showNotification('Deleted successfully', 'success');
        await loadSubject(currentSubject.id);
    } catch (error) {
        console.error('Error deleting revision:', error);
        showNotification('Failed to delete revision', 'error');
    }
}

// =============================================
// ADD REVISION ITEM MODAL
// =============================================

function addRevisionItem() {
    if (!currentSubject) {
        showNotification('Please select a subject first', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">Add Revision Item</h2>
                <button class="modal-close" onclick="closeModal(this)">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Title *</label>
                    <input type="text" id="revision-title" class="form-input" placeholder="e.g., Lambda Pricing Model" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <input type="text" id="revision-category" class="form-input" placeholder="e.g., Serverless">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal(this)">Cancel</button>
                <button class="btn btn-primary" onclick="submitRevisionItem()">Add Item</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('revision-title').focus(), 100);
}

async function submitRevisionItem() {
    const title = document.getElementById('revision-title').value.trim();
    const category = document.getElementById('revision-category').value.trim();
    
    if (!title) {
        showNotification('Please enter a title', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/progress/revisions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject_id: currentSubject.id,
                title,
                category: category || 'General'
            })
        });
        
        if (!response.ok) throw new Error('Failed to add revision item');
        
        showNotification('✅ Revision item added!', 'success');
        closeModal(document.querySelector('.modal-close'));
        await loadSubject(currentSubject.id);
    } catch (error) {
        console.error('Error adding revision item:', error);
        showNotification('Failed to add revision item', 'error');
    }
}

// =============================================
// ADD STUDY SESSION
// =============================================

function showAddStudyModal() {
    if (!currentSubject) {
        showNotification('Please select a subject first', 'error');
        return;
    }
    
    const modal = document.getElementById('addStudyModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeAddStudyModal() {
    const modal = document.getElementById('addStudyModal');
    if (modal) {
        modal.classList.remove('show');
        // Clear form
        document.getElementById('session-topics').value = '';
        document.getElementById('session-time').value = '';
        document.getElementById('session-comments').value = '';
    }
}

async function saveStudySession() {
    const topics = document.getElementById('session-topics').value.trim();
    const timeSpent = document.getElementById('session-time').value;
    const comments = document.getElementById('session-comments').value.trim();
    
    if (!topics) {
        showNotification('Please enter the topics you studied', 'error');
        return;
    }
    
    try {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const day = now.toLocaleDateString('en-US', { weekday: 'long' });
        
        const response = await fetch(`${API_BASE_URL}/progress/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject_id: currentSubject.id,
                date: date,
                day: day,
                activity: `Studied ${topics}`,
                time_spent: timeSpent ? parseInt(timeSpent * 60) : null, // Convert hours to minutes
                topics_covered: topics,
                notes: comments || null
            })
        });
        
        if (!response.ok) throw new Error('Failed to add study session');
        
        showNotification('✅ Study session added!', 'success');
        closeAddStudyModal();
        await loadSubject(currentSubject.id);
    } catch (error) {
        console.error('Error adding study session:', error);
        showNotification('Failed to add study session', 'error');
    }
}

// Update addStudySession to use showAddStudyModal
function addStudySession() {
    showAddStudyModal();
}

// =============================================
// TIMESHEET RENDERING
// =============================================

function updateTimesheet() {
    const container = document.getElementById('timesheet-table');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (studySessions.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <p>No study sessions yet. Click "Add Study Session" to get started!</p>
            </div>
        `;
        return;
    }
    
    // Create header
    const header = document.createElement('div');
    header.className = 'timesheet-header';
    header.innerHTML = `
        <div>Date & Time</div>
        <div>Topics</div>
        <div>Comments</div>
    `;
    container.appendChild(header);
    
    // Create rows (sorted by date descending)
    const sortedSessions = [...studySessions].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
    );
    
    sortedSessions.forEach(session => {
        const row = createTimesheetRow(session);
        container.appendChild(row);
    });
}

function createTimesheetRow(session) {
    const row = document.createElement('div');
    row.className = 'timesheet-row';
    
    // Format datetime
    const datetime = new Date(session.created_at || session.date);
    const formattedDate = datetime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    const formattedTime = datetime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    row.innerHTML = `
        <div class="timesheet-datetime">
            ${formattedDate}<br>
            <span style="font-size: 0.85rem; opacity: 0.8;">${formattedTime}</span>
        </div>
        <div class="timesheet-topics">${session.topics_covered || 'N/A'}</div>
        <div class="timesheet-comments">${session.notes || '-'}</div>
    `;
    
    return row;
}


// =============================================
// EXPORT PROGRESS
// =============================================

function exportProgress() {
    if (!currentSubject) return;
    
    const data = {
        subject: currentSubject,
        topics: studyTopics,
        sessions: studySessions,
        revisions: revisionItems,
        exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSubject.name.replace(/\s+/g, '-')}-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('✅ Progress exported!', 'success');
}

// =============================================
// NOTIFICATIONS
// =============================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--color-success)' : type === 'error' ? 'var(--color-danger)' : 'var(--color-info)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// =============================================
// EMPTY STATE
// =============================================

function showEmptyState() {
    document.getElementById('subject-name').textContent = 'No Subjects Yet';
    document.getElementById('subject-description').textContent = 'Create your first subject to start tracking!';
    document.getElementById('subject-icon').textContent = '📚';
    
    const main = document.querySelector('.main-content');
    if (main) {
        main.innerHTML = `
            <div style="grid-column: 1 / -1;">
                <div class="glass-card">
                    <div class="empty-state">
                        <div class="empty-state-icon">🚀</div>
                        <h3 class="empty-state-title">Welcome to Universal Study Tracker!</h3>
                        <p class="empty-state-message">Create your first subject to start tracking your learning journey.</p>
                        <button class="btn btn-primary" onclick="showCreateSubjectModal()" style="margin-top: 2rem;">
                            <span>➕</span> Create First Subject
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);
