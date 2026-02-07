import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import { 
    CheckSquare, 
    Youtube, 
    BookOpen, 
    StickyNote, 
    Plus, 
    Trash2, 
    ExternalLink, 
    Check,
    Clipboard,
    Copy,
    Edit,
    Edit2,
    Search,
    MessageSquare,
    ShoppingBag,
    ClipboardList,
    Calendar,
    CheckCircle2,
    Circle,
    Bell,
    BellRing,
    Clock,
    X,
    ChevronDown,
    FileText,
    Paperclip
} from 'lucide-react';
import api from '../api';
import './Tasks.css';

import ReminderPicker from './ReminderPicker';
import { notificationService } from '../services/notificationService';
import BidirectionalSwipeCard from './BidirectionalSwipeCard';

import { Button } from '../design-system'; // Use design system button
import { useGoals } from '../contexts/GoalsContext';

const Tasks = ({ subjectId, onLogTime, initialShareData, onAddTask, refreshKey, onSessionCreated }) => {
    const { goals } = useGoals();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [goalFilter, setGoalFilter] = useState(''); // Goal ID filter
    
    // New Task Form State
    const [type, setType] = useState('TASK'); // TASK, WATCH, READ, NOTE
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState(''); // Comma separated tags

    // Editing State
    const [editingTask, setEditingTask] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editUrl, setEditUrl] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editGoalId, setEditGoalId] = useState('');
    const [editAttachmentUrl, setEditAttachmentUrl] = useState('');
    
    // Reminder state
    const [reminderPickerVisible, setReminderPickerVisible] = useState(false);
    const [reminderTask, setReminderTask] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);



    // Handle initial share data
    useEffect(() => {
        if (initialShareData) {
            console.log('Tasks: received initialShareData', initialShareData);
            setType(initialShareData.type || 'TASK');
            setTitle(initialShareData.title || '');
            setUrl(initialShareData.url || '');
            setContent(initialShareData.text || '');
            if (onAddTask) onAddTask(initialShareData.type);
        }
    }, [initialShareData]);

    useEffect(() => {
        if (subjectId) {
            loadTasksBySubject();
        } else {
            loadAllTasks(); // Load all if no subject (Global View)
        }
    }, [subjectId, refreshKey, goalFilter]);

    const loadTasksBySubject = async () => {
        try {
            setLoading(true);
            const filters = {};
            if (goalFilter) filters.goal_id = goalFilter;

            const response = await api.tasks.getBySubject(subjectId, filters);
            // Backend returns { data: [...], pagination: ... }
            const data = response.data || response;
            setTasks(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load tasks:', error);
            message.error('Failed to load tasks');
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const loadAllTasks = async () => {
        try {
            setLoading(true);
            const filters = {};
            if (goalFilter) filters.goal_id = goalFilter;

            const response = await api.tasks.getAll(filters);
             // Backend returns { data: [...], pagination: ... }
             const data = response.data || response;
             setTasks(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load all tasks:', error);
            setTasks([]);
           // message.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };





    const handleToggle = async (task) => {
        if (!task) return;

        // Optimistic Update
        const originalTasks = [...tasks];
        const isCompleting = !task.completed;
        const updatedTaskLocal = { ...task, completed: isCompleting };

        // Immediately update UI
        setTasks(tasks.map(t => t.id === task.id ? updatedTaskLocal : t));

        // If completing, we can optionally wait a bit before removing from the active view
        // But for "swipe to complete", instantaneous feed back is better.

        try {
            // If task is being completed (not uncompleted), create a session
            if (isCompleting) {
                // Auto-create session entry
                const duration = task.type === 'TASK' ? 0.25 : task.type === 'WATCH' ? 1.0 : task.type === 'READ' ? 0.5 : 0.25; // Default hours
                
                const sessionData = {
                    subject_id: subjectId || null,
                    type: task.type === 'TASK' ? 'STUDY' : task.type === 'WATCH' ? 'WATCH' : task.type === 'READ' ? 'READ' : 'STUDY',
                    activity: task.title,
                    url: task.url || null,
                    time_spent: Math.round(duration * 60), // Ensure integer minutes
                    date: new Date().toISOString().split('T')[0],
                    day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
                    topics_covered: task.tags ? task.tags.join(', ') : '',
                    notes: task.content || `Completed: ${task.title}`
                };

                // Create session
                api.sessions.create(sessionData)
                    .then(() => {
                        message.success('Study session logged!');
                        if (onSessionCreated) onSessionCreated();
                    })
                    .catch(err => {
                        console.error('Background session creation failed:', err);
                        message.error('Failed to log session: ' + err.message);
                    });
            }
            
            // Actual API update
            const updatedTask = await api.tasks.update(task.id, {
                completed: isCompleting
            });
            
            // Sync with server response
            setTasks(currentTasks => currentTasks.map(t => t.id === task.id ? updatedTask : t));

            // Close selected view if it's the one being toggled
            if (selectedTask && selectedTask.id === task.id) {
               setSelectedTask(null);
            }

        } catch (error) {
            console.error('Failed to update task:', error);
            message.error('Failed to update item');
            // Revert on error
            setTasks(originalTasks);
        }
    };

    const handleRating = async (task, rating) => {
        try {
            const updatedTask = await api.tasks.update(task.id, { rating });
            setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
            message.success(`Rated ${rating} stars!`);
        } catch (error) {
            console.error('Failed to rate:', error);
            message.error('Failed to rate');
        }
    };

    const handleSetReminder = async (reminderData) => {
        try {
            const updatedTask = await api.tasks.setReminder(reminderTask.id, reminderData);
            setTasks(tasks.map(t => t.id === reminderTask.id ? updatedTask : t));
            setReminderPickerVisible(false);
            setReminderTask(null);
            
            // Schedule local notification on device
            await notificationService.scheduleReminder(
                tasks.find(t => t.id === reminderTask.id) || reminderData, 
                reminderData.reminder_time,
                reminderData.alert_type
            );
            
            message.success('Reminder set successfully!');
        } catch (error) {
            console.error('Failed to set reminder:', error);
            message.error('Failed to set reminder');
        }
    };

    const [editTags, setEditTags] = useState('');

    const startEditing = (task) => {
        setEditingTask(task);
        setEditTitle(task.title);
        setEditUrl(task.url || '');
        setEditContent(task.content || '');
        setEditGoalId(task.goal_id || '');
        setEditAttachmentUrl(task.attachment_url || '');
        // Convert tags array back to comma-separated string for editing
        setEditTags(Array.isArray(task.tags) ? task.tags.join(', ') : '');
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            // Parse tags string back to array
            const tagsArray = editTags.split(',').map(t => t.trim()).filter(t => t);
            
            const updatedTask = await api.tasks.update(editingTask.id, {
                title: editTitle,
                url: editUrl || null,
                content: editContent || null,
                tags: tagsArray,
                goal_id: editGoalId || null,
                attachment_url: editAttachmentUrl || null
            });

            setTasks(tasks.map(t => t.id === editingTask.id ? updatedTask : t));
            setEditingTask(null);
            message.success('Item updated');
        } catch (error) {
            console.error('Failed to update task:', error);
            message.error('Failed to update item');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.tasks.delete(id);
            setTasks(tasks.filter(t => t.id !== id));
            if (selectedTask && selectedTask.id === id) setSelectedTask(null);
            message.success('Item deleted');
        } catch (error) {
            console.error('Failed to delete task:', error);
            message.error('Failed to delete item');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        message.success('Copied to clipboard!');
    };

    const getTypeIcon = (t) => {
        switch (t) {
            case 'WATCH': return <Youtube size={16} />;
            case 'READ': return <BookOpen size={16} />;
            case 'NOTE': return <StickyNote size={16} />;
            default: return <CheckSquare size={16} />;
        }
    };

    const getYouTubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const getThumbnailUrl = (task) => {
        // For WATCH tasks, try to get YouTube thumbnail
        if (task.type === 'WATCH' && task.url) {
            const youtubeId = getYouTubeId(task.url);
            if (youtubeId) {
                return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
            }
        }
        
        // For other tasks, use Unsplash placeholders based on type
        const unsplashImages = {
            'WATCH': 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
            'READ': 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=450&fit=crop',
            'NOTE': 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=450&fit=crop',
            'TASK': 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=450&fit=crop'
        };
        
        return unsplashImages[task.type] || unsplashImages['TASK'];
    };

    return (
        <div className="tasks-container fade-in-up">
            <div className="tasks-header" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                        <h1>Tasks</h1>
                        <span>
                            {tasks.filter(t => !t.completed).length} active • {tasks.filter(t => t.completed).length} completed
                        </span>
                    </div>
                     <Button variant="primary" onClick={() => onAddTask && onAddTask('TASK')}>
                        <Plus size={18} style={{ marginRight: '6px' }} />
                        Add Task
                    </Button>
                </div>
                
                {/* Filter Row */}
                <div style={{ paddingBottom: '8px' }}>
                    <select
                        value={goalFilter}
                        onChange={(e) => setGoalFilter(e.target.value)}
                        className="form-input"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', width: '100%', fontSize: '0.9rem' }}
                    >
                        <option value="" style={{ backgroundColor: '#0A0E27', color: '#F8F9FA' }}>All Goals</option>
                        {goals.length > 0 ? (
                            goals.map(goal => (
                                <option key={goal.id} value={goal.id} style={{ backgroundColor: '#0A0E27', color: '#F8F9FA' }}>
                                    🎯 {goal.title}
                                </option>
                            ))
                        ) : (
                             <option value="" disabled style={{ backgroundColor: '#0A0E27', color: '#6c757d' }}>No goals check-in</option>
                        )}
                    </select>
                </div>
            </div>

            {/* Tasks List */}
            <div className="tasks-list">
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="empty-state">
                        <Clipboard size={48} style={{ opacity: 0.5 }} />
                        <p>No items yet. Add tasks, videos, or notes!</p>
                    </div>
                ) : (
                    <>
                        {/* Active Tasks Layer */}
                        <AnimatePresence mode="popLayout" initial={false}>
                            {tasks.filter(t => !t.completed).map(task => (
                                <motion.div
                                    key={task.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, height: 0, overflow: 'hidden', marginBottom: 0, transition: { duration: 0.2 } }}
                                >
                                    <BidirectionalSwipeCard
                                        onSwipeRight={() => handleDelete(task.id)}
                                        onSwipeLeft={() => !task.completed && handleToggle(task)}
                                        disabled={task.completed}
                                    >
                                        <div 
                                            className={`task-card card-${(task.type || 'TASK').toLowerCase()}`}
                                            onClick={() => setSelectedTask(task)}
                                            style={{ cursor: 'pointer', marginBottom: 0 }}
                                        >
                                            <div className="task-card-inner-padding">
                                                
                                                {/* 1. Header Row */}
                                                <div className="task-card-header">
                                                     <div className={`task-type-badge badge-${(task.type || 'TASK').toLowerCase()}`}>
                                                        {task.type || 'TASK'}
                                                    </div>
                                                    
                                                    {/* Actions - grouped top right */}
                                                    <div className="action-icons">
                                                         <button 
                                                            className="card-options-btn"
                                                            onClick={(e) => { e.stopPropagation(); startEditing(task); }}
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                          <button 
                                                            className="card-options-btn"
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* 2. Body */}
                                                <div className="task-card-body">
                                                    <h3 className="task-card-title">{task.title}</h3>
                                                    
                                                    {/* Conditional: Preview vs Text Main */}
                                                    {(task.type === 'WATCH' && getYouTubeId(task.url)) || task.url?.includes('instagram.com') ? (
                                                        <div className="task-card-media">
                                                            {task.type === 'WATCH' && getYouTubeId(task.url) ? (
                                                                <img
                                                                    src={`https://img.youtube.com/vi/${getYouTubeId(task.url)}/maxresdefault.jpg`}
                                                                    alt={task.title}
                                                                    className="task-card-thumbnail"
                                                                    onClick={(e) => { e.stopPropagation(); window.open(task.url, '_blank'); }}
                                                                />
                                                            ) : (
                                                                <div className="instagram-gradient-preview" onClick={(e) => { e.stopPropagation(); window.open(task.url, '_blank'); }}>
                                                                    <div className="instagram-preview-icon">
                                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                                                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                                                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            )}
                                                             <div className="media-play-overlay">
                                                                {task.type === 'WATCH' ? <Youtube size={32} /> : <ExternalLink size={28} />}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* Text Main Mode (No Preview) */
                                                        <p className="task-main-text">
                                                            {task.content || (task.url ? task.url.replace(/^https?:\/\//, '') : 'No details provided.')}
                                                        </p>
                                                    )}
                                                    {/* Attachment Display */}
                                                    {task.attachment_url && (
                                                        <div 
                                                            style={{ 
                                                                marginTop: '12px', 
                                                                padding: '10px', 
                                                                background: 'rgba(255,255,255,0.05)', 
                                                                borderRadius: '8px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                cursor: 'pointer',
                                                                border: '1px solid rgba(255,255,255,0.1)'
                                                            }}
                                                            onClick={(e) => { e.stopPropagation(); window.open(task.attachment_url, '_blank'); }}
                                                        >
                                                            {task.attachment_url.includes('excel') || task.attachment_url.includes('sheet') || task.attachment_url.includes('xls') || task.attachment_url.includes('1drv.ms/x') ? (
                                                                <div style={{ background: '#1D6F42', padding: '6px', borderRadius: '6px', display: 'flex' }}>
                                                                    <FileText size={16} color="white" />
                                                                </div>
                                                            ) : (
                                                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '6px', display: 'flex' }}>
                                                                    <Paperclip size={16} color="white" />
                                                                </div>
                                                            )}
                                                            <div style={{ overflow: 'hidden' }}>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
                                                                    Attached File
                                                                </div>
                                                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {task.attachment_url.replace(/^https?:\/\//, '')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 3. Footer Row */}
                                                <div className="task-card-footer">
                                                    <div className="task-date">
                                                        <Calendar size={12} />
                                                        {new Date(task.created_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </div>

                                                    <div className="footer-actions">
                                                        <button 
                                                            className="action-icon-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onLogTime && onLogTime({
                                                                    activity: task.title,
                                                                    type: task.type,
                                                                    url: task.url,
                                                                    notes: task.content
                                                                });
                                                            }}
                                                            title="Log Time"
                                                        >
                                                            <Clock size={16} />
                                                        </button>
                                                         <button 
                                                            className="action-icon-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setReminderTask(task);
                                                                setReminderPickerVisible(true);
                                                            }}
                                                            title="Set Reminder"
                                                        >
                                                            <Bell size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div >
                                    </BidirectionalSwipeCard>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Completed Tasks Section */}
                        {tasks.some(t => t.completed) && (
                            <div className="completed-section">
                                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '1rem', paddingLeft: '0.5rem' }}>Completed</h3>
                                <div style={{ opacity: 0.6 }}>
                                    {tasks.filter(t => t.completed).map(task => (
                                        <BidirectionalSwipeCard
                                            key={task.id}
                                            onSwipeRight={() => handleDelete(task.id)}
                                        >
                                            <div
                                                className={`task-card completed`}
                                                onClick={() => setSelectedTask(task)}
                                            >
                                            <div className="task-card-inner-padding">
                                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                     <div className={`task-type-badge badge-${(task.type || 'task').toLowerCase() === 'task' ? 'course' : (task.type || 'task').toLowerCase()}`}>
                                                        {task.type || 'TASK'}
                                                    </div>
                                                    <button 
                                                        className="action-icon-btn delete"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                 </div>

                                                 <div>
                                                    <h3 className="task-card-title" style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.5)', marginTop: '12px' }}>{task.title}</h3>
                                                 </div>

                                                 <div 
                                                    className="complete-toggle" 
                                                    onClick={(e) => { e.stopPropagation(); handleToggle(task); }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', alignSelf: 'flex-start', marginTop: '12px' }}
                                                 >
                                                    <CheckCircle2 size={20} color="#06D6A0" />
                                                    <span style={{ fontSize: '0.9rem', color: '#06D6A0', fontWeight: 500 }}>
                                                        Completed
                                                    </span>
                                                 </div>
                                            </div>
                                        </div>
                                        </BidirectionalSwipeCard>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Edit Modal */}
            {editingTask && (
                <div className="modal-overlay" onClick={() => setEditingTask(null)}>
                    <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Item</h3>
                            <button className="close-btn" onClick={() => setEditingTask(null)}>×</button>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    required
                                    autoFocus
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>URL (Optional)</label>
                                <input
                                    type="url"
                                    value={editUrl}
                                    onChange={(e) => setEditUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Link to Goal</label>
                                <select
                                    value={editGoalId}
                                    onChange={(e) => setEditGoalId(e.target.value)}
                                    className="form-input"
                                >
                                    <option value="" style={{ backgroundColor: '#181926', color: '#F8F9FA' }}>None</option>
                                    {goals.map(goal => (
                                        <option key={goal.id} value={goal.id} style={{ backgroundColor: '#181926', color: '#F8F9FA' }}>
                                            {goal.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Attachment URL</label>
                                <input
                                    type="url"
                                    value={editAttachmentUrl}
                                    onChange={(e) => setEditAttachmentUrl(e.target.value)}
                                    placeholder="https://1drv.ms/x/..."
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Topics / Tags (comma separated)</label>
                                <input
                                    type="text"
                                    value={editTags}
                                    onChange={(e) => setEditTags(e.target.value)}
                                    placeholder="math, algebra, exam-prep"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Notes / Content</label>
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    rows={5}
                                    placeholder="Add notes, descriptions, or details..."
                                    className="form-textarea"
                                />
                            </div>

                            <div className="modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setEditingTask(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SELECTED TASK LAYER (Bottom Sheet) */}
            <AnimatePresence>
                {selectedTask && (
                    <>
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="layer-backdrop"
                            onClick={() => setSelectedTask(null)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1400 }}
                        />
                        
                        {/* Bottom Sheet */}
                        <motion.div 
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="selected-task-layer"
                            drag="y"
                            dragConstraints={{ top: 0 }}
                            dragElastic={0.05}
                            onDragEnd={(e, { offset, velocity }) => {
                                if (offset.y > 100 || velocity.y > 500) {
                                    setSelectedTask(null);
                                }
                            }}
                        >
                            <div className="layer-handle-bar">
                                <div className="layer-handle" />
                            </div>

                            <div className="layer-content">
                                {/* Header */}
                                <div className="layer-header">
                                    <div className={`task-type-badge badge-${(selectedTask.type || 'TASK').toLowerCase()}`}>
                                        {selectedTask.type || 'TASK'}
                                    </div>
                                    <button 
                                        onClick={() => setSelectedTask(null)}
                                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '8px', color: 'white', cursor: 'pointer' }}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Title */}
                                <h1 className="layer-title">{selectedTask.title}</h1>
                                
                                <div className="task-meta-row" style={{ background: 'transparent', padding: '0 0 1rem 0' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                                        <Calendar size={16} /> {new Date(selectedTask.created_at || Date.now()).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Content Grid */}
                                <div className="layer-grid">
                                    
                                    {/* Link / Video Preview */}
                                    {selectedTask.type === 'WATCH' && getYouTubeId(selectedTask.url) && (
                                        <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', marginBottom: '20px' }}>
                                            <iframe 
                                                width="100%" 
                                                height="220" 
                                                src={`https://www.youtube.com/embed/${getYouTubeId(selectedTask.url)}`} 
                                                title="YouTube video player" 
                                                frameBorder="0" 
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                                        <button 
                                            className="btn btn-primary"
                                            style={{ height: '50px', fontSize: '1rem', background: selectedTask.completed ? '#10B981' : 'var(--color-primary)' }}
                                            onClick={() => handleToggle(selectedTask)}
                                        >
                                            {selectedTask.completed ? (
                                                <><CheckCircle2 size={20} style={{ marginRight: '8px' }} /> Completed</>
                                            ) : (
                                                <><CheckSquare size={20} style={{ marginRight: '8px' }} /> Mark Complete</>
                                            )}
                                        </button>
                                        
                                        <button 
                                            className="btn btn-secondary"
                                            style={{ height: '50px', fontSize: '1rem' }}
                                            onClick={() => {
                                                onLogTime && onLogTime({
                                                    activity: selectedTask.title,
                                                    type: selectedTask.type,
                                                    url: selectedTask.url,
                                                    notes: selectedTask.content
                                                });
                                            }}
                                        >
                                            <Clock size={20} style={{ marginRight: '8px' }} /> Log Study
                                        </button>
                                    </div>

                                    {/* Notes */}
                                    {selectedTask.content && (
                                        <div style={{ marginBottom: '24px' }}>
                                            <h4 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>Notes</h4>
                                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', lineHeight: '1.6', color: 'rgba(255,255,255,0.9)' }}>
                                                {selectedTask.content}
                                            </div>
                                        </div>
                                    )}

                                    {/* URL */}
                                    {selectedTask.url && (
                                        <div style={{ marginBottom: '24px' }}>
                                            <h4 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>Link</h4>
                                            <a 
                                                href={selectedTask.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF8C42', textDecoration: 'none', padding: '12px', background: 'rgba(255,140,66,0.1)', borderRadius: '12px' }}
                                            >
                                                <ExternalLink size={18} /> {selectedTask.url}
                                            </a>
                                        </div>
                                    )}

                                    {/* Integrations */}
                                    <div>
                                        <h4 style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>Quick Actions</h4>
                                        <div className="integration-grid" style={{ marginTop: '0', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                                             <a href={`https://www.google.com/search?q=${encodeURIComponent(selectedTask.title)}`} target="_blank" rel="noopener noreferrer" className="integration-btn google-btn">
                                                 <Search size={18} /> Google Search
                                             </a>
                                             <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedTask.title)}`} target="_blank" rel="noopener noreferrer" className="integration-btn youtube-btn">
                                                 <Youtube size={18} /> Find Video
                                             </a>
                                             <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer" className="integration-btn chatgpt-btn">
                                                 <MessageSquare size={18} /> Ask ChatGPT
                                             </a>
                                        </div>
                                    </div>

                                    {/* Admin */}
                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
                                        <button 
                                            onClick={() => handleDelete(selectedTask.id)}
                                            style={{ color: '#EF4444', background: 'none', border: 'none', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8, cursor: 'pointer' }}
                                        >
                                            <Trash2 size={18} /> Delete Task
                                        </button>
                                    </div>
                                    
                                    {/* Spacer for bottom safe area */}
                                    <div style={{ height: '40px' }} />
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Reminder Picker Modal */}
            {reminderPickerVisible && reminderTask && (
                <ReminderPicker
                    task={reminderTask}
                    onSetReminder={handleSetReminder}
                    onCancel={() => {
                        setReminderPickerVisible(false);
                        setReminderTask(null);
                    }}
                />
            )}



        </div>
    );
};

export default React.memo(Tasks);
