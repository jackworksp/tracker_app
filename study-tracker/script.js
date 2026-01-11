// AWS Study Tracker - Interactive Functionality
// =============================================

// Study Topics Data
const studyTopics = [
    { id: 1, name: 'DynamoDB', completed: true, category: 'Database' },
    { id: 2, name: 'Lambda Functions', completed: false, category: 'Compute' },
    { id: 3, name: 'API Gateway', completed: false, category: 'Networking' },
    { id: 4, name: 'S3 Advanced Features', completed: false, category: 'Storage' },
    { id: 5, name: 'CloudFormation', completed: false, category: 'IaC' },
    { id: 6, name: 'CodePipeline/CodeDeploy', completed: false, category: 'CI/CD' },
    { id: 7, name: 'Elastic Beanstalk', completed: false, category: 'Compute' },
    { id: 8, name: 'SQS/SNS/EventBridge', completed: false, category: 'Integration' },
    { id: 9, name: 'Step Functions', completed: false, category: 'Orchestration' },
    { id: 10, name: 'Cognito', completed: false, category: 'Security' },
    { id: 11, name: 'CloudWatch/X-Ray', completed: false, category: 'Monitoring' },
    { id: 12, name: 'KMS/IAM Security', completed: false, category: 'Security' },
    { id: 13, name: 'VPC Basics', completed: false, category: 'Networking' },
    { id: 14, name: 'ECS/Fargate', completed: false, category: 'Containers' },
    { id: 15, name: 'ElastiCache', completed: false, category: 'Database' }
];

// Study Session Data (from timesheet)
let studySessions = [
    {
        date: '2025-12-28',
        day: 'Saturday',
        activity: 'Quiz Completed',
        topics: ['DynamoDB', 'DAX', 'WCU/RCU', 'GSI/LSI', 'Partitions', 'Consistency Models', 'Scan vs Query', 'Transactions', 'Streams', 'IAM Access'],
        duration: 2,
        notes: 'Completed 10 DynamoDB practice questions. Key learnings on GSI throttling and capacity calculations.',
        status: 'completed'
    }
];

// Revision Tracker Data (Spaced Repetition)
let revisionItems = [
    {
        id: 1,
        task: 'DynamoDB - RCU/WCU Calculations',
        date: '2025-12-28',
        revisionCount: 2,
        lastRevised: '2025-12-28',
        notes: 'Practice capacity calculations'
    },
    {
        id: 2,
        task: 'Lambda Functions - Cold Start Optimization',
        date: '2025-12-29',
        revisionCount: 0,
        lastRevised: null,
        notes: 'Need to review provisioned concurrency'
    }
];

let nextRevisionId = 3;

// Initialize the Application
document.addEventListener('DOMContentLoaded', function() {
    initializeTopicsChecklist();
    initializeRevisionTracker();
    updateStatistics();
    loadProgressFromLocalStorage();
    
    // Add smooth scroll animation observer
    observeElements();
});

// Initialize Topics Checklist
function initializeTopicsChecklist() {
    const checklistContainer = document.getElementById('topics-checklist');
    
    studyTopics.forEach(topic => {
        const topicItem = document.createElement('div');
        topicItem.className = `topic-item ${topic.completed ? 'completed' : ''}`;
        topicItem.onclick = () => toggleTopic(topic.id);
        
        topicItem.innerHTML = `
            <input type="checkbox" 
                   class="topic-checkbox" 
                   ${topic.completed ? 'checked' : ''} 
                   id="topic-${topic.id}">
            <label class="topic-label" for="topic-${topic.id}">
                ${topic.name}
                <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 0.5rem;">
                    (${topic.category})
                </span>
            </label>
        `;
        
        checklistContainer.appendChild(topicItem);
    });
}

// Toggle Topic Completion
function toggleTopic(topicId) {
    const topic = studyTopics.find(t => t.id === topicId);
    if (topic) {
        topic.completed = !topic.completed;
        
        // Update the UI
        const topicItem = document.querySelector(`#topic-${topicId}`).closest('.topic-item');
        const checkbox = document.getElementById(`topic-${topicId}`);
        
        if (topic.completed) {
            topicItem.classList.add('completed');
            checkbox.checked = true;
            showNotification(`✅ ${topic.name} marked as completed!`, 'success');
        } else {
            topicItem.classList.remove('completed');
            checkbox.checked = false;
            showNotification(`📝 ${topic.name} marked as incomplete`, 'info');
        }
        
        // Update statistics
        updateStatistics();
        saveProgressToLocalStorage();
    }
}

// Update Statistics
function updateStatistics() {
    const completedTopics = studyTopics.filter(t => t.completed).length;
    const totalTopics = studyTopics.length;
    const overallProgress = Math.round((completedTopics / totalTopics) * 100);
    
    // Update header stats
    document.getElementById('completed-topics').textContent = completedTopics;
    
    // Update stat cards
    document.getElementById('topics-completed').textContent = `${completedTopics}/${totalTopics}`;
    document.getElementById('exam-readiness').textContent = `${overallProgress}%`;
    
    // Update progress bar
    const progressElement = document.getElementById('overall-progress');
    if (progressElement) {
        progressElement.textContent = `${overallProgress}%`;
        const progressBar = progressElement.closest('.progress-item').querySelector('.progress-bar');
        progressBar.style.width = `${overallProgress}%`;
    }
    
    // Update total hours
    const totalHours = studySessions.reduce((sum, session) => sum + session.duration, 0);
    document.getElementById('total-hours').textContent = totalHours;
    
    // Update other stats
    document.getElementById('total-study-days').textContent = studySessions.length;
}

// Add Study Session
function addStudySession() {
    const modal = createStudySessionModal();
    document.body.appendChild(modal);
    
    // Animate modal in
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'scale(1)';
    }, 10);
}

// Create Study Session Modal
function createStudySessionModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    const today = new Date().toISOString().split('T')[0];
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: var(--bg-secondary);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-lg);
            padding: 2rem;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        ">
            <h2 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>📚</span> Add Study Session
            </h2>
            
            <form id="study-session-form" style="display: grid; gap: 1.5rem;">
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Date</label>
                    <input type="date" id="session-date" value="${today}" 
                           style="width: 100%; padding: 0.75rem; background: var(--bg-primary); 
                                  border: 2px solid var(--glass-border); border-radius: var(--radius-sm);
                                  color: var(--text-primary); font-family: var(--font-family);">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Activity</label>
                    <input type="text" id="session-activity" placeholder="e.g., Quiz Completed, Video Watched"
                           style="width: 100%; padding: 0.75rem; background: var(--bg-primary); 
                                  border: 2px solid var(--glass-border); border-radius: var(--radius-sm);
                                  color: var(--text-primary); font-family: var(--font-family);">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Topics Covered (comma-separated)</label>
                    <textarea id="session-topics" rows="3" placeholder="e.g., Lambda, API Gateway, CloudWatch"
                              style="width: 100%; padding: 0.75rem; background: var(--bg-primary); 
                                     border: 2px solid var(--glass-border); border-radius: var(--radius-sm);
                                     color: var(--text-primary); font-family: var(--font-family); resize: vertical;"></textarea>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Duration (hours)</label>
                    <input type="number" id="session-duration" min="0.5" step="0.5" value="1"
                           style="width: 100%; padding: 0.75rem; background: var(--bg-primary); 
                                  border: 2px solid var(--glass-border); border-radius: var(--radius-sm);
                                  color: var(--text-primary); font-family: var(--font-family);">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Notes</label>
                    <textarea id="session-notes" rows="3" placeholder="Key learnings, observations, etc."
                              style="width: 100%; padding: 0.75rem; background: var(--bg-primary); 
                                     border: 2px solid var(--glass-border); border-radius: var(--radius-sm);
                                     color: var(--text-primary); font-family: var(--font-family); resize: vertical;"></textarea>
                </div>
                
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;">
                        <span>✅</span> Add Session
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()" style="flex: 1;">
                        <span>❌</span> Cancel
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Handle form submission
    modal.querySelector('#study-session-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const date = document.getElementById('session-date').value;
        const activity = document.getElementById('session-activity').value;
        const topicsStr = document.getElementById('session-topics').value;
        const duration = parseFloat(document.getElementById('session-duration').value);
        const notes = document.getElementById('session-notes').value;
        
        if (!activity || !topicsStr) {
            showNotification('⚠️ Please fill in all required fields', 'warning');
            return;
        }
        
        const topics = topicsStr.split(',').map(t => t.trim());
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        
        const newSession = {
            date,
            day: dayName,
            activity,
            topics,
            duration,
            notes,
            status: 'completed'
        };
        
        studySessions.unshift(newSession);
        addTimelineItem(newSession);
        updateStatistics();
        saveProgressToLocalStorage();
        
        modal.remove();
        showNotification('✅ Study session added successfully!', 'success');
    });
    
    return modal;
}

// Add Timeline Item
function addTimelineItem(session) {
    const timeline = document.getElementById('study-timeline');
    const dateObj = new Date(session.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    
    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item';
    timelineItem.style.animation = 'fadeInUp 0.6s ease-out';
    
    timelineItem.innerHTML = `
        <div class="timeline-date">📅 ${formattedDate}</div>
        <div class="timeline-content">
            <h4 class="timeline-title">✅ ${session.activity}</h4>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                ${session.notes || 'No additional notes'}
                <br>Duration: ~${session.duration} hour${session.duration !== 1 ? 's' : ''}
            </p>
            
            <div style="margin-bottom: 1rem;">
                <strong style="color: var(--color-accent);">Topics Covered:</strong>
            </div>
            <div class="timeline-topics">
                ${session.topics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}
            </div>
        </div>
    `;
    
    timeline.insertBefore(timelineItem, timeline.firstChild);
}

// Show Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: var(--glass-bg);
        backdrop-filter: var(--glass-blur);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-md);
        padding: 1rem 1.5rem;
        color: var(--text-primary);
        font-weight: 600;
        box-shadow: var(--shadow-xl);
        z-index: 2000;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
    `;
    
    const colors = {
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-danger)',
        info: 'var(--color-info)'
    };
    
    notification.style.borderLeft = `4px solid ${colors[type]}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
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
`;
document.head.appendChild(style);

// Export Progress
function exportProgress() {
    const completedTopics = studyTopics.filter(t => t.completed);
    const totalHours = studySessions.reduce((sum, s) => sum + s.duration, 0);
    
    const exportData = {
        summary: {
            totalStudyDays: studySessions.length,
            totalHours: totalHours,
            topicsCompleted: completedTopics.length,
            totalTopics: studyTopics.length,
            progress: Math.round((completedTopics.length / studyTopics.length) * 100)
        },
        completedTopics: completedTopics.map(t => t.name),
        studySessions: studySessions,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `aws-study-progress-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification('📥 Progress exported successfully!', 'success');
}

// Save Progress to LocalStorage
function saveProgressToLocalStorage() {
    const data = {
        topics: studyTopics,
        sessions: studySessions,
        revisionItems: revisionItems,
        nextRevisionId: nextRevisionId
    };
    localStorage.setItem('awsStudyProgress', JSON.stringify(data));
}

// Load Progress from LocalStorage
function loadProgressFromLocalStorage() {
    const saved = localStorage.getItem('awsStudyProgress');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.topics) {
                // Update topics with saved data
                data.topics.forEach(savedTopic => {
                    const topic = studyTopics.find(t => t.id === savedTopic.id);
                    if (topic) {
                        topic.completed = savedTopic.completed;
                    }
                });
            }
            if (data.sessions && data.sessions.length > studySessions.length) {
                studySessions = data.sessions;
                // Rebuild timeline
                const timeline = document.getElementById('study-timeline');
                timeline.innerHTML = '';
                studySessions.forEach(session => addTimelineItem(session));
            }
            if (data.revisionItems) {
                revisionItems = data.revisionItems;
                renderRevisionItems();
            }
            if (data.nextRevisionId) {
                nextRevisionId = data.nextRevisionId;
            }
        } catch (e) {
            console.error('Error loading saved progress:', e);
        }
    }
}

// Observe Elements for Animation
function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.fade-in-up').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + N: Add new study session
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        addStudySession();
    }
    
    // Ctrl/Cmd + E: Export progress
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportProgress();
    }
});

console.log('🚀 AWS Study Tracker initialized successfully!');
console.log('💡 Keyboard shortcuts:');
console.log('   Ctrl/Cmd + N: Add new study session');
console.log('   Ctrl/Cmd + E: Export progress');

// ============================================
// REVISION TRACKER (SPACED REPETITION) FUNCTIONS
// ============================================

// Initialize Revision Tracker
function initializeRevisionTracker() {
    renderRevisionItems();
}

// Render Revision Items
function renderRevisionItems() {
    const container = document.getElementById('revision-tracker');
    
    if (!revisionItems || revisionItems.length === 0) {
        container.innerHTML = `
            <div class="revision-empty">
                <div class="revision-empty-icon">📝</div>
                <p>No revision items yet. Click "Add Item" to start tracking your spaced repetition!</p>
            </div>
        `;
        return;
    }
    
    // Sort by revision count (ascending) then by date
    const sortedItems = [...revisionItems].sort((a, b) => {
        if (a.revisionCount !== b.revisionCount) {
            return a.revisionCount - b.revisionCount;
        }
        return new Date(a.date) - new Date(b.date);
    });
    
    container.innerHTML = sortedItems.map(item => {
        const dateObj = new Date(item.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        const lastRevisedText = item.lastRevised 
            ? new Date(item.lastRevised).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'Never';
        
        return `
            <div class="revision-item" data-revision-count="${Math.min(item.revisionCount, 10)}">
                <div class="revision-count-badge">${item.revisionCount}</div>
                <div class="revision-details">
                    <div class="revision-title">${item.task}</div>
                    <div class="revision-date">📅 Added: ${formattedDate} | Last: ${lastRevisedText}</div>
                    ${item.notes ? `<div class="revision-notes">${item.notes}</div>` : ''}
                </div>
                <div class="revision-actions">
                    <button class="btn-icon btn-success" onclick="markAsRevised(${item.id})" title="Mark as Revised">✔️</button>
                    <button class="btn-icon btn-danger" onclick="deleteRevisionItem(${item.id})" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// Add Revision Item
function addRevisionItem() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    const today = new Date().toISOString().split('T')[0];
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: var(--bg-secondary);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-lg);
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        ">
            <h2 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>🔄</span> Add Revision Item
            </h2>
            
            <form id="revision-item-form" style="display: grid; gap: 1.5rem;">
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Task/Topic</label>
                    <input type="text" id="revision-task" placeholder="e.g., Lambda - Environment Variables"
                           required
                           style="width: 100%; padding: 0.75rem; background: var(--bg-primary); 
                                  border: 2px solid var(--glass-border); border-radius: var(--radius-sm);
                                  color: var(--text-primary); font-family: var(--font-family);">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Date Added</label>
                    <input type="date" id="revision-date" value="${today}"
                           style="width: 100%; padding: 0.75rem; background: var(--bg-primary); 
                                  border: 2px solid var(--glass-border); border-radius: var(--radius-sm);
                                  color: var(--text-primary); font-family: var(--font-family);">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Notes (Optional)</label>
                    <textarea id="revision-notes" rows="3" placeholder="Key points to remember..."
                              style="width: 100%; padding: 0.75rem; background: var(--bg-primary); 
                                     border: 2px solid var(--glass-border); border-radius: var(--radius-sm);
                                     color: var(--text-primary); font-family: var(--font-family); resize: vertical;"></textarea>
                </div>
                
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;">
                        <span>✅</span> Add Item
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()" style="flex: 1;">
                        <span>❌</span> Cancel
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate modal in
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'scale(1)';
    }, 10);
    
    // Handle form submission
    modal.querySelector('#revision-item-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const task = document.getElementById('revision-task').value.trim();
        const date = document.getElementById('revision-date').value;
        const notes = document.getElementById('revision-notes').value.trim();
        
        if (!task) {
            showNotification('⚠️ Please enter a task/topic', 'warning');
            return;
        }
        
        const newItem = {
            id: nextRevisionId++,
            task,
            date,
            revisionCount: 0,
            lastRevised: null,
            notes
        };
        
        revisionItems.push(newItem);
        renderRevisionItems();
        saveProgressToLocalStorage();
        
        modal.remove();
        showNotification('✅ Revision item added successfully!', 'success');
    });
}

// Mark Item as Revised
function markAsRevised(itemId) {
    const item = revisionItems.find(i => i.id === itemId);
    if (item) {
        item.revisionCount++;
        item.lastRevised = new Date().toISOString().split('T')[0];
        
        renderRevisionItems();
        saveProgressToLocalStorage();
        
        const emoji = item.revisionCount === 1 ? '🎉' : item.revisionCount >= 4 ? '🔥' : '✅';
        showNotification(`${emoji} "${item.task}" revised! Count: ${item.revisionCount}`, 'success');
    }
}

// Delete Revision Item
function deleteRevisionItem(itemId) {
    if (confirm('Are you sure you want to delete this revision item?')) {
        revisionItems = revisionItems.filter(i => i.id !== itemId);
        renderRevisionItems();
        saveProgressToLocalStorage();
        showNotification('🗑️ Revision item deleted', 'info');
    }
}
