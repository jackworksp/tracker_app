import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  CheckCircle,
  Clock,
  Trash2,
  Link as LinkIcon,
  Plus,
  Search,
  Youtube,
  MessageSquare,
  CheckSquare,
  Square,
  ExternalLink,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { message } from 'antd';
import AddSubtaskModal from './AddSubtaskModal';
import TaskSelectorModal from './TaskSelectorModal';
import NoteAttachmentCard from './NoteAttachmentCard';
import AddAttachmentModal from './AddAttachmentModal';
import AddNoteModal from './AddNoteModal';
import api from '../api';
import './TaskDetailModal.css';

const TaskDetailModal = ({ task, onClose, onComplete, onLogStudy, onDelete, onUpdate, onTaskClick }) => {
  if (!task) return null;

  // Local state for interactive fields
  const [status, setStatus] = useState(task.status || (task.completed ? 'DONE' : 'TODO'));
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [resources, setResources] = useState(task.resources || []);

  // Modal states
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isAddAttachmentModalOpen, setIsAddAttachmentModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // Relational subtasks state
  const [relationalSubtasks, setRelationalSubtasks] = useState([]);

  // Linked notes state
  const [linkedNotes, setLinkedNotes] = useState([]);

  // Sync local state if task prop changes
  useEffect(() => {
      setStatus(task.status || (task.completed ? 'DONE' : 'TODO'));
      setSubtasks(task.subtasks || []);
      setResources(task.resources || []);
  }, [task]);

  // Load relational subtasks
  useEffect(() => {
      if (task && task.id) {
          loadRelationalSubtasks();
          loadLinkedNotes();
      }
  }, [task.id]);

  const loadRelationalSubtasks = async () => {
      try {
          const subtasks = await api.tasks.getSubtasks(task.id);
          setRelationalSubtasks(subtasks);
      } catch (error) {
          console.error('Failed to load relational subtasks:', error);
          setRelationalSubtasks([]);
      }
  };

  const loadLinkedNotes = async () => {
      try {
          const notes = await api.noteLinks.getTaskNotes(task.id);
          setLinkedNotes(notes || []);
      } catch (error) {
          console.error('Failed to load linked notes:', error);
          setLinkedNotes([]);
      }
  };

  const getTypeColor = (type) => {
    const colors = {
      'WATCH': '#FF6467',
      'READ': '#4A90E2',
      'NOTE': '#F5A623',
      'TASK': '#7B68EE'
    };
    return colors[type] || '#7B68EE';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  // Status Handler
  const handleStatusChange = (newStatus) => {
      setStatus(newStatus);
      if (onUpdate) onUpdate(task.id, { status: newStatus });
  };

  // Subtask Handlers
  const handleAddSubtask = (subtaskData) => {
      const updatedSubtasks = [...subtasks, subtaskData];
      setSubtasks(updatedSubtasks);
      setIsAddingSubtask(false);
      if (onUpdate) onUpdate(task.id, { subtasks: updatedSubtasks });
  };

  const toggleSubtask = (id) => {
      const updatedSubtasks = subtasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      setSubtasks(updatedSubtasks);
      if (onUpdate) onUpdate(task.id, { subtasks: updatedSubtasks });
  };
    
  const deleteSubtask = (id) => {
       const updatedSubtasks = subtasks.filter(t => t.id !== id);
       setSubtasks(updatedSubtasks);
       if(onUpdate) onUpdate(task.id, { subtasks: updatedSubtasks });
  };

  // Resource Handlers
   const deleteResource = (id) => {
       const updatedResources = resources.filter(r => r.id !== id);
       setResources(updatedResources);
       if(onUpdate) onUpdate(task.id, { resources: updatedResources });
  };

  // Attachment Handlers
  const handleUnlinkNote = async (noteId) => {
      try {
          await api.noteLinks.unlinkFromTask(task.id, noteId);
          await loadLinkedNotes();
          message.success('Note unlinked');
      } catch (error) {
          console.error('Failed to unlink note:', error);
          message.error('Failed to unlink note');
      }
  const handleUnlinkNote = async (noteId) => {
      try {
          await api.noteLinks.unlinkFromTask(task.id, noteId);
          await loadLinkedNotes();
          message.success('Note unlinked');
      } catch (error) {
          console.error('Failed to unlink note:', error);
          message.error('Failed to unlink note');
      }
  };

  const handleNoteClick = (note) => {
      setEditingNote(note);
      setIsNoteModalOpen(true);
  };

  const handleSaveNote = async (noteData) => {
      try {
          await api.notes.update(noteData.id, noteData);
          message.success('Note updated');
          await loadLinkedNotes();
          setIsNoteModalOpen(false);
          setEditingNote(null);
      } catch (error) {
          console.error('Failed to update note:', error);
          message.error('Failed to update note');
      }
  };

  const handleAttachmentAdded = async () => {
      await loadLinkedNotes();
      setIsAddAttachmentModalOpen(false);
      // Reload resources
      if (onUpdate) onUpdate();
  };

  // Relational subtask handlers
  const handleConvertToSubtask = async (parentTask) => {
      try {
          await api.tasks.convertToSubtask(task.id, parentTask.id);
          setIsConvertModalOpen(false);
          onClose();
          if (onUpdate) onUpdate(); // Refresh task list
      } catch (error) {
          console.error('Failed to convert task:', error);
          alert('Failed to convert task to subtask');
      }
  };

  const handleToggleRelationalSubtask = async (subtask) => {
      try {
          const updated = await api.tasks.update(subtask.id, {
              completed: !subtask.completed
          });
          setRelationalSubtasks(relationalSubtasks.map(t =>
              t.id === subtask.id ? updated : t
          ));
      } catch (error) {
          console.error('Failed to toggle subtask:', error);
      }
  };

  const handleRemoveRelationalSubtask = async (subtask) => {
      try {
          await api.tasks.removeFromSubtask(subtask.id);
          loadRelationalSubtasks();
          if (onUpdate) onUpdate(); // Refresh task list
      } catch (error) {
          console.error('Failed to remove subtask:', error);
      }
  };

  // Helper function to extract YouTube video ID
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Legacy Attachments
  const getAttachments = () => {
    const attachments = [];
    if (task.url) {
        const youtubeId = getYouTubeId(task.url);
        attachments.push({ 
          type: youtubeId ? 'youtube' : task.url.includes('instagram') ? 'instagram' : 'link', 
          url: task.url,
          youtubeId
        });
    }
    if (task.attachment_url) {
        const youtubeId = getYouTubeId(task.attachment_url);
        attachments.push({ 
          type: youtubeId ? 'youtube' : task.attachment_url.includes('instagram') ? 'instagram' : 'link', 
          url: task.attachment_url,
          youtubeId
        });
    }
    return attachments;
  };
  const legacyAttachments = getAttachments();

  const handleQuickAction = (action) => {
    const query = encodeURIComponent(task.title);
    const urls = {
      google: `https://www.google.com/search?q=${query}`,
      youtube: `https://www.youtube.com/results?search_query=${query}`,
      chatgpt: 'https://chatgpt.com/'
    };
    if (urls[action]) window.open(urls[action], '_blank');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="task-detail-backdrop"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, x: '-50%', y: 'calc(-50% + 20px)' }}
        animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
        exit={{ opacity: 0, scale: 0.95, x: '-50%', y: 'calc(-50% + 20px)' }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="task-detail-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="task-detail-handle-bar">
          <div className="task-detail-handle" />
        </div>

        <div className="task-detail-content">
          {/* Header */}
          <div className="task-detail-header">
            <div className="task-detail-type-badge" style={{
                backgroundColor: `${getTypeColor(task.type)}33`,
                borderColor: `${getTypeColor(task.type)}66`,
                color: getTypeColor(task.type)
              }}>
              {task.type || 'TASK'}
            </div>
            
            {/* Status Dropdown */}
            <div style={{ marginLeft: 'auto', marginRight: '12px' }}>
                <select 
                    value={status} 
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="status-select"
                    style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.1)',
                        color: status === 'DONE' ? '#4ade80' : status === 'TODO' ? '#9ca3af' : '#60a5fa',
                        border: '1px solid rgba(255,255,255,0.2)',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        outline: 'none'
                    }}
                >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="DONE">Done</option>
                </select>
            </div>

            <button className="task-detail-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* Title & Date */}
          <div className="task-detail-title-section">
            <h1 className="task-detail-title">{task.title}</h1>
            <div className="task-detail-date">
              <Calendar size={16} />
              <span>{formatDate(task.created_at)}</span>
            </div>
            {task.content && (
                <p style={{ 
                    marginTop: '12px', 
                    fontSize: '0.95rem', 
                    lineHeight: '1.5', 
                    color: 'rgba(255,255,255,0.7)' 
                }}>
                    {task.content}
                </p>
            )}
          </div>

          {/* SUBTASKS SECTION */}
          <div className="task-detail-section">
            <h4 className="task-detail-section-label">
                SUBTASKS (
                {subtasks.filter(t => t.completed).length + relationalSubtasks.filter(t => t.completed).length}/
                {subtasks.length + relationalSubtasks.length}
                )
            </h4>
            <div className="subtasks-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {subtasks.map(subtask => (
                    <div key={subtask.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <div 
                            onClick={() => toggleSubtask(subtask.id)}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {subtask.completed ? (
                                <CheckSquare size={20} color="#4ade80" />
                            ) : (
                                <Square size={20} color="rgba(255,255,255,0.3)" />
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ 
                                fontSize: '0.9rem', 
                                color: subtask.completed ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)',
                                textDecoration: subtask.completed ? 'line-through' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                {subtask.type && (
                                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                        {subtask.type === 'STUDY' && '📚'}
                                        {subtask.type === 'WATCH' && '📺'}
                                        {subtask.type === 'READ' && '📖'}
                                        {subtask.type === 'COURSE' && '🎓'}
                                    </span>
                                )}
                                {subtask.title}
                            </div>
                            {(subtask.url || subtask.attachment_url) && (
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px', display: 'flex', gap: '6px' }}>
                                    {subtask.url && <LinkIcon size={12} />}
                                    {subtask.topics && <span>• {subtask.topics}</span>}
                                </div>
                            )}
                        </div>
                        <button onClick={() => deleteSubtask(subtask.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                            <X size={16} />
                        </button>
                    </div>
                ))}

                {/* Relational Subtasks */}
                {relationalSubtasks.map(subtask => (
                    <div key={`rel-${subtask.id}`} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px',
                        background: 'rgba(139, 92, 246, 0.05)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        borderRadius: '8px'
                    }}>
                        <div
                            onClick={() => handleToggleRelationalSubtask(subtask)}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                            {subtask.completed ? (
                                <CheckSquare size={20} color="#4ade80" />
                            ) : (
                                <Square size={20} color="rgba(255,255,255,0.3)" />
                            )}
                        </div>
                        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => onTaskClick && onTaskClick(subtask)}>
                            <div style={{
                                fontSize: '0.9rem',
                                color: subtask.completed ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)',
                                textDecoration: subtask.completed ? 'line-through' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                {subtask.type && (
                                    <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '4px' }}>
                                        {subtask.type}
                                    </span>
                                )}
                                {subtask.title}
                            </div>
                            {subtask.url && (
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px', display: 'flex', gap: '6px' }}>
                                    <LinkIcon size={12} /> <a href={subtask.url} onClick={(e) => e.stopPropagation()} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>Link</a>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => handleRemoveRelationalSubtask(subtask)}
                            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
                            title="Promote to top-level task"
                        >
                            <ExternalLink size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <button
                onClick={() => setIsAddingSubtask(true)}
                style={{ 
                    marginTop: '10px', 
                    width: '100%', 
                    padding: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px',
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px dashed rgba(255,255,255,0.2)', 
                    borderRadius: '8px', 
                    color: 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                }}
            >
                <Plus size={16} /> Add Subtask
            </button>
          </div>

          {/* ATTACHMENTS SECTION */}
          <div className="task-detail-section">
            <h4 className="task-detail-section-label">
              ATTACHMENTS ({linkedNotes.length + resources.length + legacyAttachments.length})
            </h4>

            {/* Combined Visual Attachments (Notes + Instagram/YouTube) - in one grid */}
            {(linkedNotes.length > 0 || legacyAttachments.length > 0) && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))',
                gap: '6px',
                width: '100%',
                marginBottom: resources.length > 0 ? '12px' : '0'
              }}>
                {/* Linked Notes */}
                {linkedNotes.map(note => (
                  <NoteAttachmentCard
                    key={note.id}
                    note={note}
                    onUnlink={() => handleUnlinkNote(note.id)}
                    onClick={() => handleNoteClick(note)}
                  />
                ))}
                
                {/* Legacy Attachments (Instagram/YouTube) */}
                {legacyAttachments.map((att, i) => (
                  <a
                    key={`legacy-${i}`}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textDecoration: 'none',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: 'rgba(255,255,255,0.02)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = att.type === 'youtube' ? '0 4px 12px rgba(239, 68, 68, 0.3)' : att.type === 'instagram' ? '0 4px 12px rgba(225, 48, 108, 0.3)' : '0 4px 12px rgba(255,255,255,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {att.type === 'youtube' && att.youtubeId ? (
                      // YouTube Thumbnail Box
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        paddingTop: '100%', // 1:1 square aspect ratio
                        background: '#000',
                        overflow: 'hidden'
                      }}>
                        <img
                          src={`https://img.youtube.com/vi/${att.youtubeId}/default.jpg`}
                          alt="YouTube"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        {/* Small Play Button */}
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
                    ) : att.type === 'instagram' ? (
                      // Instagram Box
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        paddingTop: '100%', // 1:1 aspect ratio
                        background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)'
                        }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="2"/>
                            <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2"/>
                            <circle cx="18" cy="6" r="1.5" fill="white"/>
                          </svg>
                        </div>
                      </div>
                    ) : (
                      // Regular Link Icon
                      <div style={{
                        width: '100%',
                        paddingTop: '100%',
                        position: 'relative',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: '8px'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)'
                        }}>
                          <LinkIcon size={16} color="rgba(255,255,255,0.6)" />
                        </div>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            )}

            {/* Updated Resources - shown vertically */}
            {resources.length > 0 && (
              <div className="resources-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: resources.length > 0 && legacyAttachments.length > 0 ? '16px' : '0' }}>
                {resources.map(resource => (
                    <div key={resource.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                         <div style={{
                             width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)',
                             display: 'flex', alignItems: 'center', justifyContent: 'center'
                         }}>
                            <LinkIcon size={16} color="rgba(255,255,255,0.6)" />
                        </div>
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: '500' }}>{resource.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resource.url}</div>
                        </a>
                        <button onClick={() => deleteResource(resource.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
              </div>
            )}

            {/* Add Attachment Button */}
            <button
                onClick={() => setIsAddAttachmentModalOpen(true)}
                style={{
                    marginTop: '10px',
                    width: '100%',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px dashed rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                }}
            >
                <Plus size={16} /> Add Attachment
            </button>

          </div>

          {/* Convert to Subtask */}
          <div className="task-detail-section">
            <button
                onClick={() => setIsConvertModalOpen(true)}
                style={{
                    width: '100%',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: '#a78bfa',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                }}
            >
                <Plus size={16} /> Convert to Subtask
            </button>
          </div>

          {/* Quick Actions */}
          <div className="task-detail-section">
            <h4 className="task-detail-section-label">QUICK ACTIONS</h4>
            <div className="task-detail-quick-actions">
              <button className="task-detail-quick-action" onClick={() => handleQuickAction('google')}>
                <Search size={16} /> <span>Google Search</span>
              </button>
              <button className="task-detail-quick-action" onClick={() => handleQuickAction('youtube')}>
                <Youtube size={16} /> <span>Find Video</span>
              </button>
              <button className="task-detail-quick-action" onClick={() => handleQuickAction('chatgpt')}>
                <MessageSquare size={16} /> <span>Ask ChatGPT</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="task-detail-actions">
            <button
              className="task-detail-btn task-detail-btn-primary"
              onClick={() => {
                onComplete(task);
                onClose();
              }}
            >
              <CheckCircle size={20} />
              <span>{task.completed ? 'Mark Incomplete' : 'Mark Complete'}</span>
            </button>

            <button
              className="task-detail-btn task-detail-btn-secondary"
              onClick={() => {
                onLogStudy(task);
                onClose();
              }}
            >
              <Clock size={20} />
              <span>Log Study</span>
            </button>
          </div>

          {/* Delete Button */}
          <div className="task-detail-delete-section">
            <button
              className="task-detail-delete-btn"
              onClick={() => {
                onDelete(task.id);
                onClose();
              }}
            >
              <Trash2 size={14} />
              <span>Delete Task</span>
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Subtask Modal */}
      {isAddingSubtask && (
        <AddSubtaskModal
          isOpen={isAddingSubtask}
          onClose={() => setIsAddingSubtask(false)}
          onSubmit={handleAddSubtask}
        />
      )}

      {/* Task Selector Modal */}
      {isConvertModalOpen && (
        <TaskSelectorModal
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          onSelectTask={handleConvertToSubtask}
          excludeTaskId={task.id}
          currentSubjectId={task.subject_id}
        />
      )}

      {/* Add Attachment Modal */}
      <AddAttachmentModal
        isOpen={isAddAttachmentModalOpen}
        onClose={() => setIsAddAttachmentModalOpen(false)}
        taskId={task.id}
        onAttachmentAdded={handleAttachmentAdded}
        existingNoteIds={linkedNotes.map(note => note.id)}
        currentResources={resources}
      />

      {/* Note Edit Modal */}
      <AddNoteModal
        visible={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSubmit={handleSaveNote}
        initialData={editingNote}
      />
    </AnimatePresence>
  );
};

export default TaskDetailModal;
