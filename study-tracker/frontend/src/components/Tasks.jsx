import React, { useState, useEffect } from 'react';
import { message } from 'antd';
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
    Search,
    MessageSquare,
    ShoppingBag,
    ClipboardList,
    Calendar,
    CheckCircle2
} from 'lucide-react';
import api from '../api';
import './Tasks.css';

const Tasks = ({ subjectId }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    
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
    const [selectedTask, setSelectedTask] = useState(null);

    useEffect(() => {
        if (subjectId) {
            loadTasksBySubject();
        } else {
            loadAllTasks(); // Load all if no subject (Global View)
        }
    }, [subjectId]);

    const loadTasksBySubject = async () => {
        try {
            setLoading(true);
            const data = await api.tasks.getBySubject(subjectId);
            setTasks(data);
        } catch (error) {
            console.error('Failed to load tasks:', error);
            message.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const loadAllTasks = async () => {
        try {
            setLoading(true);
            const data = await api.tasks.getAll();
            setTasks(data);
        } catch (error) {
            console.error('Failed to load all tasks:', error);
           // message.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            message.warning('Please enter a title');
            return;
        }

        try {
            const newTask = await api.tasks.create({
                subject_id: subjectId,
                type,
                title,
                url: (type === 'WATCH' || type === 'READ') ? url : null,
                content: type === 'NOTE' ? content : null,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean)
            });
            
            setTasks([newTask, ...tasks]);
            
            // Reset form
            setTitle('');
            setUrl('');
            setContent('');
            setTags('');
            message.success('Item added!');
        } catch (error) {
            console.error('Failed to create task:', error);
            message.error('Failed to add item');
        }
    };

    const handleToggle = async (task) => {
        try {
            const updatedTask = await api.tasks.update(task.id, {
                completed: !task.completed
            });
            
            setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
        } catch (error) {
            console.error('Failed to update task:', error);
            message.error('Failed to update item');
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

    const startEditing = (task) => {
        setEditingTask(task);
        setEditTitle(task.title);
        setEditUrl(task.url || '');
        setEditContent(task.content || '');
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const updatedTask = await api.tasks.update(editingTask.id, {
                title: editTitle,
                url: editingTask.type === 'WATCH' || editingTask.type === 'READ' ? editUrl : null,
                content: editingTask.type === 'NOTE' ? editContent : null
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

    return (
        <div className="tasks-container fade-in-up">
            <div className="glass-card">
                <div className="card-header tasks-header">
                    <h3 className="card-title">
                        <span className="card-icon"><ClipboardList size={20} /></span>
                        Study Queue & Tasks
                    </h3>
                </div>

                {/* Add Item Form */}
                <form onSubmit={handleCreate} className="add-task-form glass-card">
                    <div className="task-type-selector">
                        <button 
                            type="button"
                            className={`type-btn ${type === 'TASK' ? 'active' : ''}`}
                            onClick={() => setType('TASK')}
                        >
                            <CheckSquare size={16} /> Task
                        </button>
                        <button 
                            type="button"
                            className={`type-btn ${type === 'WATCH' ? 'active' : ''}`}
                            onClick={() => setType('WATCH')}
                        >
                            <Youtube size={16} /> Watch
                        </button>
                        <button 
                            type="button"
                            className={`type-btn ${type === 'READ' ? 'active' : ''}`}
                            onClick={() => setType('READ')}
                        >
                            <BookOpen size={16} /> Read
                        </button>
                        <button 
                            type="button"
                            className={`type-btn ${type === 'NOTE' ? 'active' : ''}`}
                            onClick={() => setType('NOTE')}
                        >
                            <StickyNote size={16} /> Note
                        </button>
                    </div>

                    <div className="input-group" style={{ flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={
                                    type === 'WATCH' ? "Video title..." :
                                    type === 'READ' ? "Article title..." :
                                    type === 'NOTE' ? "Note title..." :
                                    "What do you need to do?"
                                }
                                autoFocus
                            />
                            <button type="submit" className="add-btn">
                                <Plus size={24} />
                            </button>
                        </div>
                        
                        {(type === 'WATCH' || type === 'READ') && (
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste link here (https://...)"
                            />
                        )}
                        
                        {type === 'NOTE' && (
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Paste text snippet or write note here..."
                                rows={3}
                            />
                        )}
                    </div>
                    
                    {/* Tags Input */}
                    <div className="input-group" style={{ marginTop: '0.5rem' }}>
                         <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="Tags (e.g. #italian, #quick)"
                            style={{ fontSize: '0.9rem' }}
                         />
                    </div>
                </form>

                {/* Tasks List */}
                <div className="tasks-list">
                    {loading ? (
                        <div className="loading-spinner" style={{ alignSelf: 'center' }}></div>
                    ) : tasks.length === 0 ? (
                        <div className="empty-state">
                            <Clipboard size={48} style={{ opacity: 0.5 }} />
                            <p>No items yet. Add tasks, videos, or notes above!</p>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                                <div 
                                    className="task-checkbox-container"
                                    onClick={() => handleToggle(task)}
                                >
                                    <div className={`task-checkbox ${task.completed ? 'checked' : ''}`}>
                                        {task.completed && <Check size={14} color="white" />}
                                    </div>
                                </div>
                                
                                <div className="task-content" onClick={() => setSelectedTask(task)} style={{ cursor: 'pointer' }}>
                                    <div className="task-header">
                                        <div className={`task-type-badge badge-${task.type.toLowerCase()}`}>
                                            {task.type}
                                        </div>
                                        {task.type !== 'TASK' && getTypeIcon(task.type)}
                                        <span className="task-text">{task.title}</span>
                                    </div>

                                    {task.url && (
                                        <a 
                                            href={task.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="task-link"
                                        >
                                            <ExternalLink size={12} />
                                            Open Link
                                        </a>
                                    )}

                                    {/* YouTube Thumbnail */}
                                    {task.type === 'WATCH' && getYouTubeId(task.url) && (
                                        <div className="task-thumbnail-container">
                                            <img 
                                                src={`https://img.youtube.com/vi/${getYouTubeId(task.url)}/mqdefault.jpg`} 
                                                alt="Video Thumbnail" 
                                                className="task-thumbnail"
                                            />
                                        </div>
                                    )}

                                    {task.content && (
                                        <div className="task-snippet">
                                            {task.content}
                                        </div>
                                    )}
                                <div className="task-meta">
                                    {(task.tags || []).filter(Boolean).map((tag, i) => (
                                        <span key={i} className="tag-badge">#{tag.replace(/^#/, '')}</span>
                                    ))}
                                    
                                    {task.completed && (
                                        <div className="star-rating">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <span 
                                                    key={star} 
                                                    className={`star ${star <= (task.rating || 0) ? 'filled' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Call API to update rating directly? Or use handleUpdate?
                                                        // For simplicity, we'll create a dedicated handler or just update state locally then API?
                                                        // We'll invoke a handleRating function
                                                        handleRating(task, star);
                                                    }}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {task.completed && (
                                        <div className="star-rating">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <span 
                                                    key={star} 
                                                    className={`star ${star <= (task.rating || 0) ? 'filled' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRating(task, star);
                                                    }}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                </div>

                                <div className="task-actions">
                                    {(task.content || task.url) && (
                                        <button 
                                            className="action-btn" 
                                            onClick={() => copyToClipboard(task.url || task.content)}
                                            title="Copy content"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    )}
                                    <button 
                                        className="action-btn" 
                                        onClick={() => startEditing(task)}
                                        title="Edit"
                                        style={{ color: 'var(--color-primary)' }}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                        className="action-btn delete" 
                                        onClick={() => handleDelete(task.id)}
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
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
                                    />
                                </div>

                                {(editingTask.type === 'WATCH' || editingTask.type === 'READ') && (
                                    <div className="form-group">
                                        <label>URL</label>
                                        <input
                                            type="url"
                                            value={editUrl}
                                            onChange={(e) => setEditUrl(e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                )}

                                {editingTask.type === 'NOTE' && (
                                    <div className="form-group">
                                        <label>Content</label>
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            rows={5}
                                        />
                                    </div>
                                )}

                                <div className="modal-actions">
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
            </div>

                {/* Task Details Modal */}
                {selectedTask && (
                    <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
                        <div className="modal-content glass-card details-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="details-header-top">
                                    <div className={`task-type-badge badge-${selectedTask.type.toLowerCase()}`}>
                                        {selectedTask.type}
                                    </div>
                                     <button className="close-btn" onClick={() => setSelectedTask(null)}>×</button>
                                </div>
                                <h3>{selectedTask.title}</h3>
                                <div className="task-meta-row">
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={14} /> {new Date(selectedTask.created_at).toLocaleDateString()}
                                    </span>
                                    {selectedTask.completed && (
                                        <span className="status-badge" style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckCircle2 size={14} /> Completed
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="details-body">
                                {selectedTask.content && (
                                    <div className="details-section">
                                        <h4>Notes</h4>
                                        <div className="task-snippet">{selectedTask.content}</div>
                                    </div>
                                )}
                                
                                 {selectedTask.tags && selectedTask.tags.length > 0 && (
                                    <div className="details-section">
                                        <h4>Tags</h4>
                                        <div className="tags-list">
                                             {selectedTask.tags.map((t, i) => <span key={i} className="tag-badge">#{t.replace('#','')}</span>)}
                                        </div>
                                    </div>
                                )}

                                 <div className="integration-grid">
                                     <a href={`https://www.google.com/search?q=${encodeURIComponent(selectedTask.title)}`} target="_blank" rel="noopener noreferrer" className="integration-btn google-btn">
                                         <Search size={18} /> Google Search
                                     </a>
                                     <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedTask.title)}`} target="_blank" rel="noopener noreferrer" className="integration-btn youtube-btn">
                                         <Youtube size={18} /> Find Video
                                     </a>
                                     <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer" className="integration-btn chatgpt-btn">
                                         <MessageSquare size={18} /> Ask ChatGPT
                                     </a>
                                     <a href={`https://www.amazon.com/s?k=${encodeURIComponent(selectedTask.title)}`} target="_blank" rel="noopener noreferrer" className="integration-btn amazon-btn">
                                         <ShoppingBag size={18} /> Shop Amazon
                                     </a>
                                 </div>
                            </div>
                            
                             <div className="modal-actions" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                 <button className="btn btn-secondary" onClick={() => {
                                     startEditing(selectedTask);
                                     setSelectedTask(null);
                                 }}>Edit</button>
                                  <button className="btn btn-danger" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' }} onClick={() => {
                                     handleDelete(selectedTask.id);
                                     setSelectedTask(null);
                                 }}>Delete</button>
                             </div>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default Tasks;
