import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Clock, Youtube, ExternalLink, X } from 'lucide-react';
import './ShareConfirmModal.css';

const ShareConfirmModal = ({ visible, shareData, onChoice, onCancel }) => {
    if (!visible || !shareData) return null;

    const isYouTube = shareData.url?.includes('youtube') || shareData.url?.includes('youtu.be');
    const isInstagram = shareData.url?.includes('instagram.com');
    const isUrl = shareData.url?.startsWith('http');

    const getPreviewImage = () => {
        // For YouTube, extract video ID and show thumbnail
        if (isYouTube) {
            const match = shareData.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
            if (match) {
                return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
            }
        }

        // For Instagram, we'll use a gradient placeholder with Instagram colors
        if (isInstagram) {
            return null; // Will show custom Instagram card
        }

        return null;
    };

    const previewImage = getPreviewImage();

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="share-modal-backdrop"
                        onClick={onCancel}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="share-modal-container"
                    >
                        <div className="share-modal-content">
                            {/* Header */}
                            <div className="share-modal-header">
                                <h2>📥 Shared Content</h2>
                                <button className="share-modal-close" onClick={onCancel}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Preview Section */}
                            <div className="share-preview-section">
                                {/* Platform Badge */}
                                {isYouTube && (
                                    <div className="share-platform-badge youtube">
                                        <Youtube size={16} />
                                        <span>YouTube</span>
                                    </div>
                                )}
                                {isInstagram && (
                                    <div className="share-platform-badge instagram">
                                        <ExternalLink size={16} />
                                        <span>Instagram</span>
                                    </div>
                                )}
                                {isUrl && !isYouTube && !isInstagram && (
                                    <div className="share-platform-badge link">
                                        <ExternalLink size={16} />
                                        <span>Link</span>
                                    </div>
                                )}

                                {/* Content Preview */}
                                {previewImage ? (
                                    <div className="share-preview-image-container">
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="share-preview-image"
                                        />
                                        {isYouTube && (
                                            <div className="share-preview-overlay">
                                                <div className="share-play-icon">
                                                    <Youtube size={32} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : isInstagram ? (
                                    <div className="share-instagram-preview">
                                        <div className="instagram-gradient-bg">
                                            <div className="instagram-icon-container">
                                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="share-text-preview">
                                        <div className="share-preview-icon">
                                            {shareData.type === 'WATCH' ? '🎥' : '📝'}
                                        </div>
                                    </div>
                                )}

                                {/* Title */}
                                <h3 className="share-content-title">
                                    {shareData.activity || shareData.text}
                                </h3>

                                {/* URL if present */}
                                {shareData.url && (
                                    <a
                                        href={shareData.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="share-content-url"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        🔗 {shareData.url.replace(/^https?:\/\//, '').substring(0, 50)}
                                        {shareData.url.length > 50 ? '...' : ''}
                                    </a>
                                )}

                                {/* Notes if present */}
                                {shareData.notes && (
                                    <p className="share-content-notes">
                                        {shareData.notes}
                                    </p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="share-modal-actions">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="share-action-btn add-task-btn"
                                    onClick={() => onChoice('TASK')}
                                >
                                    <CheckSquare size={20} />
                                    <div>
                                        <div className="btn-title">Add as Task</div>
                                        <div className="btn-subtitle">Save to your task list</div>
                                    </div>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="share-action-btn log-session-btn"
                                    onClick={() => onChoice('SESSION')}
                                >
                                    <Clock size={20} />
                                    <div>
                                        <div className="btn-title">Log Session</div>
                                        <div className="btn-subtitle">Record time spent</div>
                                    </div>
                                </motion.button>
                            </div>

                            {/* Helper Text */}
                            <p className="share-modal-helper">
                                Choose how you want to save this content
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ShareConfirmModal;
