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
import BidirectionalSwipeCard from './BidirectionalSwipeCard';
import TaskDetailModal from './TaskDetailModal';
import AddNoteModal from './AddNoteModal';
import AddTaskModal from './AddTaskModal';

import { Button } from '@design-system'; // Use design system button
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

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);

    // Note Modal State
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);



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

        const isCompleting = !task.completed;

        // Block completion if there are incomplete subtasks
        if (isCompleting) {
            const incompleteInline = (task.subtasks || []).filter(s => !s.completed).length;
            let incompleteRelational = 0;
            try {
                const relational = await api.tasks.getSubtasks(task.id);
                incompleteRelational = relational.filter(s => !s.completed).length;
            } catch (e) {
                // ignore fetch error, proceed without relational check
            }
            const totalIncomplete = incompleteInline + incompleteRelational;
            if (totalIncomplete > 0) {
                message.warning(`Complete all subtasks first (${totalIncomplete} remaining).`);
                return;
            }
        }

        // Optimistic Update
        const originalTasks = [...tasks];
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

    const handleEditSubmit = async (updatedData) => {
        if (!taskToEdit) return;

        try {
            const updatedTask = await api.tasks.update(taskToEdit.id, updatedData);
            setTasks(tasks.map(t => t.id === taskToEdit.id ? updatedTask : t));

            // Update selected task if it's the same task
            if (selectedTask && selectedTask.id === taskToEdit.id) {
                setSelectedTask(updatedTask);
            }

            message.success('Task updated successfully');
            setIsEditModalOpen(false);
            setTaskToEdit(null);
        } catch (error) {
            console.error('Failed to update task:', error);
            message.error('Failed to update task');
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

    const handleNoteBadgeClick = async (e, task) => {
        e.stopPropagation();
        try {
            const notes = await api.noteLinks.getTaskNotes(task.id);
            if (notes && notes.length === 1) {
                setEditingNote(notes[0]);
                setIsNoteModalOpen(true);
            } else {
                // If 0 or >1 notes, open task detail
                setSelectedTask(task);
            }
        } catch (error) {
            console.error('Failed to load notes for task:', error);
            // Fallback
            setSelectedTask(task);
        }
    };

    const handleSaveNote = async (noteData) => {
        try {
            await api.notes.update(noteData.id, noteData);
            message.success('Note updated');
            setIsNoteModalOpen(false);
            setEditingNote(null);
            // Optionally refresh tasks if needed, but note content usually doesn't affect list view
        } catch (error) {
            console.error('Failed to update note:', error);
            message.error('Failed to update note');
        }
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
                                                    {task.status && task.status !== 'TODO' && task.status !== 'DONE' && (
                                                        <div className={`task-type-badge`} style={{ 
                                                            marginLeft: '8px', 
                                                            backgroundColor: task.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                            color: task.status === 'IN_PROGRESS' ? '#60a5fa' : '#f87171',
                                                            border: `1px solid ${task.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                                                        }}>
                                                            {task.status.replace('_', ' ')}
                                                        </div>
                                                    )}
                                                    
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
                                                    
                                                    {/* Content/Description */}
                                                    {task.content && (
                                                        <p className="task-main-text" style={{ WebkitLineClamp: 2 }}>
                                                            {task.content}
                                                        </p>
                                                    )}

                                                    {/* Attachments Container - Horizontal Layout */}
                                                    {(task.url || task.attachment_url) && (
                                                        <div className="attachments-horizontal-wrapper" style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center' }}>

                                                    {/* Linked Notes Indicator - REMOVED */}

                                                    {/* URL Attachment Display - Square Thumbnail Box */}
                                                    {task.url && (
                                                        <a
                                                            href={task.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{
                                                                width: '50px',
                                                                height: '50px',
                                                                borderRadius: '8px',
                                                                overflow: 'hidden',
                                                                display: 'block',
                                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                                flexShrink: 0
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                                const youtubeId = getYouTubeId(task.url);
                                                                e.currentTarget.style.boxShadow = youtubeId ? '0 4px 12px rgba(239, 68, 68, 0.3)' : task.url?.includes('instagram') ? '0 4px 12px rgba(225, 48, 108, 0.3)' : '0 4px 12px rgba(255,255,255,0.1)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = 'none';
                                                            }}
                                                        >
                                                            {getYouTubeId(task.url) ? (
                                                                <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
                                                                    <img
                                                                        src={`https://img.youtube.com/vi/${getYouTubeId(task.url)}/default.jpg`}
                                                                        alt="YouTube"
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                    />
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        top: '50%',
                                                                        left: '50%',
                                                                        transform: 'translate(-50%, -50%)',
                                                                        width: '20px',
                                                                        height: '16px',
                                                                        background: 'rgba(255, 0, 0, 0.9)',
                                                                        borderRadius: '4px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}>
                                                                        <div style={{
                                                                            width: 0,
                                                                            height: 0,
                                                                            borderLeft: '6px solid white',
                                                                            borderTop: '4px solid transparent',
                                                                            borderBottom: '4px solid transparent',
                                                                            marginLeft: '1px'
                                                                        }} />
                                                                    </div>
                                                                </div>
                                                            ) : task.url?.includes('instagram.com') ? (
                                                               <div style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}>
                                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="2"/>
                                                                        <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2"/>
                                                                        <circle cx="18" cy="6" r="1.5" fill="white"/>
                                                                    </svg>
                                                                </div>
                                                            ) : (
                                                                <div style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    background: 'rgba(255,255,255,0.08)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}>
                                                                    <ExternalLink size={16} color="rgba(255,255,255,0.6)" />
                                                                </div>
                                                            )}
                                                        </a>
                                                    )}

                                                    {/* Additional Attachment Display */}
                                                    {task.attachment_url && (
                                                        getYouTubeId(task.attachment_url) || task.attachment_url.includes('youtube') || task.attachment_url.includes('youtu.be') || task.attachment_url.includes('instagram.com') ? (
                                                            // Square thumbnail box for YouTube/Instagram
                                                            <a
                                                                href={task.attachment_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                style={{
                                                                    width: '50px',
                                                                    height: '50px',
                                                                    borderRadius: '8px',
                                                                    overflow: 'hidden',
                                                                    display: 'block',
                                                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                                                    flexShrink: 0
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                                    const youtubeId = getYouTubeId(task.attachment_url);
                                                                    e.currentTarget.style.boxShadow = youtubeId ? '0 4px 12px rgba(239, 68, 68, 0.3)' : task.attachment_url?.includes('instagram') ? '0 4px 12px rgba(225, 48, 108, 0.3)' : '0 4px 12px rgba(255,255,255,0.1)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                                    e.currentTarget.style.boxShadow = 'none';
                                                                }}
                                                            >
                                                                {(getYouTubeId(task.attachment_url) || task.attachment_url.includes('youtube') || task.attachment_url.includes('youtu.be')) ? (
                                                                    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
                                                                        <img
                                                                            src={`https://img.youtube.com/vi/${getYouTubeId(task.attachment_url)}/default.jpg`}
                                                                            alt="YouTube"
                                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                        />
                                                                        <div style={{
                                                                            position: 'absolute',
                                                                            top: '50%',
                                                                            left: '50%',
                                                                            transform: 'translate(-50%, -50%)',
                                                                            width: '20px',
                                                                            height: '16px',
                                                                            background: 'rgba(255, 0, 0, 0.9)',
                                                                            borderRadius: '4px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center'
                                                                        }}>
                                                                            <div style={{
                                                                                width: 0,
                                                                                height: 0,
                                                                                borderLeft: '6px solid white',
                                                                                borderTop: '4px solid transparent',
                                                                                borderBottom: '4px solid transparent',
                                                                                marginLeft: '1px'
                                                                            }} />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}>
                                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                            <rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="2"/>
                                                                            <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2"/>
                                                                            <circle cx="18" cy="6" r="1.5" fill="white"/>
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </a>
                                                        ) : (
                                                            // Square box for files with filename
                                                            <div
                                                                style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    maxWidth: '80px'
                                                                }}
                                                            >
                                                                <a
                                                                    href={task.attachment_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    style={{
                                                                        width: '50px',
                                                                        height: '50px',
                                                                        borderRadius: '8px',
                                                                        overflow: 'hidden',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                                                        flexShrink: 0,
                                                                        background: task.attachment_url.includes('excel') || task.attachment_url.includes('sheet') || task.attachment_url.includes('xls') || task.attachment_url.includes('1drv.ms/x') ? '#1D6F42' : 'rgba(255,255,255,0.08)'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,255,255,0.1)';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                                        e.currentTarget.style.boxShadow = 'none';
                                                                    }}
                                                                >
                                                                    {task.attachment_url.includes('excel') || task.attachment_url.includes('sheet') || task.attachment_url.includes('xls') || task.attachment_url.includes('1drv.ms/x') ? (
                                                                        <FileText size={20} color="white" />
                                                                    ) : (
                                                                        <Paperclip size={20} color="rgba(255,255,255,0.6)" />
                                                                    )}
                                                                </a>
                                                                {/* Filename below the box */}
                                                                <div
                                                                    style={{
                                                                        fontSize: '0.65rem',
                                                                        color: 'rgba(255,255,255,0.7)',
                                                                        textAlign: 'center',
                                                                        lineHeight: '1.2',
                                                                        maxWidth: '80px',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        display: '-webkit-box',
                                                                        WebkitLineClamp: 2,
                                                                        WebkitBoxOrient: 'vertical',
                                                                        wordBreak: 'break-word'
                                                                    }}
                                                                >
                                                                    {task.attachment_url.includes('excel') || task.attachment_url.includes('sheet') || task.attachment_url.includes('xls') || task.attachment_url.includes('1drv.ms/x') ? 'Excel File' : 'Attached File'}
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
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

            {/* SELECTED TASK MODAL */}
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onComplete={handleToggle}
                    onUpdate={async (taskId, updates) => {
                        // If called without parameters, refresh the entire task list
                        if (taskId === undefined) {
                            subjectId ? loadTasksBySubject() : loadAllTasks();
                            return;
                        }

                        try {
                            const updatedTask = await api.tasks.update(taskId, updates);
                            setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
                            // Also update selected task to reflect changes immediately in modal
                            setSelectedTask(updatedTask);
                            return updatedTask;
                        } catch (error) {
                            console.error('Failed to update task:', error);
                            message.error('Failed to update task');
                            throw error;
                        }
                    }}
                    onLogStudy={(task) => {
                        onLogTime && onLogTime({
                            activity: task.title,
                            type: task.type,
                            url: task.url,
                            notes: task.content
                        });
                    }}
                    onDelete={handleDelete}
                    onTaskClick={setSelectedTask}
                    onEdit={(task) => {
                        setTaskToEdit(task);
                        setIsEditModalOpen(true);
                    }}
                />
            )}

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

            {/* Note Edit Modal */}
            <AddNoteModal
                visible={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                onSubmit={handleSaveNote}
                initialData={editingNote}
            />

            {/* Edit Task Modal */}
            <AddTaskModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setTaskToEdit(null);
                }}
                onSubmit={handleEditSubmit}
                initialValues={taskToEdit}
            />

        </div>
    );
};

export default React.memo(Tasks);
