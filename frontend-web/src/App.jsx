import { useState, useEffect, useCallback, memo } from 'react';
import { message } from 'antd';
import { CapacitorShareTarget } from '@capgo/capacitor-share-target';
import { Calendar, Clipboard, Menu, User, Paperclip } from 'lucide-react';
import Header from './components/Header';
import StatsGrid from './components/StatsGrid';



import Timeline from './components/Timeline';
import Tasks from './components/Tasks';
import CreateSubjectModal from './components/CreateSubjectModal';
import ManageSubjectsModal from './components/ManageSubjectsModal';
import AddSessionModal from './components/AddSessionModal';
import EditSessionModal from './components/EditSessionModal';
import SessionDetailModal from './components/SessionDetailModal';
import AddRevisionModal from './components/AddRevisionModal';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import BottomNav from './components/BottomNav';
import AddTaskModal from './components/AddTaskModal';
import ProfilePage from './components/ProfilePage';
import GoalsPage from './components/GoalsPage';

import AttachmentsHub from './components/AttachmentsHub';
import AuthPage from './components/AuthPage';
import ShareConfirmModal from './components/ShareConfirmModal';
import api from './api';
import './App.css';

// Contexts & Hooks
import { useUser } from './contexts/UserContext';
import { GoalsProvider, useGoals } from './contexts/GoalsContext';
import useModals from './hooks/useModals';
import useProgress from './hooks/useProgress';
import useSubjects from './hooks/useSubjects';

// Import the design system
import './design-system/index';
// Import Sidebar components
import { Sidebar, SidebarItem, SidebarGroup } from './design-system';

// Capacitor for native mobile features
import { initCapacitor, isNativePlatform } from './utils/capacitor';

function AppContent() {
  const { user, isCheckingAuth, login, signup, updateUser, logout } = useUser();
  const { goals } = useGoals();
  const {
    subjects, currentSubject, loading, error, setError,
    loadSubjects, handleSubjectChange, createSubject, deleteSubject,
  } = useSubjects(user);

  const {
    progress, stats, refreshProgress,
    sessionSourceFilter, setSessionSourceFilter,
    sessionDateRange, setSessionDateRange, clearFilters,
  } = useProgress(currentSubject, user);

  const {
    modalState, openModal, closeModal, setShareData, clearShareData, isOpen,
  } = useModals();

  const [activeTab, setActiveTab] = useState('tasks');
  const [tasksRefreshKey, setTasksRefreshKey] = useState(0);
  const [selectedSession, setSelectedSession] = useState(null);

  // Initialize Capacitor & share intent listener
  useEffect(() => {
    initCapacitor();

    if (window.Capacitor) {
      CapacitorShareTarget.addListener('shareReceived', (result) => {
        if (result.texts && result.texts.length > 0) {
          const sharedText = result.texts[0];
          const urlRegex = /(https?:\/\/[^\s]+)/;
          const urlMatch = sharedText.match(urlRegex);

          let url = urlMatch ? urlMatch[0] : '';
          let title = result.title || '';
          let text = sharedText;

          if (url) {
            const potentialTitle = sharedText.replace(url, '').trim();
            if (potentialTitle && !title) title = potentialTitle;
            if (!title) title = 'Shared Link';
          } else {
            title = sharedText.length > 50 ? sharedText.substring(0, 50) + '...' : sharedText;
          }

          const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

          const data = {
            activity: title,
            url,
            notes: title === 'Shared Link' ? '' : title,
            text,
            type: isYouTube ? 'WATCH' : 'TASK'
          };

          if (url && sharedText.includes(url)) {
            const lines = sharedText.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length > 1) {
              const lineWithUrl = lines.findIndex(l => l.includes(url));
              if (lineWithUrl > -1) {
                const titleLine = lines.find((l, i) => i !== lineWithUrl);
                if (titleLine) {
                  data.activity = titleLine.trim();
                  data.notes = titleLine.trim();
                }
              }
            }
          }

          setShareData(data);
        }
      }).catch(err => console.error('Share Intent Error:', err));
    }
  }, [setShareData]);

  // Load subjects when user authenticates
  useEffect(() => {
    if (user) {
      loadSubjects();
    }
  }, [user, loadSubjects]);

  const handleShareChoice = useCallback(async (choice) => {
    const pending = modalState.pendingShareData;
    closeModal();

    document.body.style.overflow = '';

    if (choice === 'SESSION') {
      openModal('addSession', {
        sessionInitialData: {
          activity: pending.activity,
          url: pending.url,
          notes: pending.notes
        }
      });
    } else if (choice === 'TASK') {
      setActiveTab('tasks');
      openModal('addTask', {
        initialTaskShareData: {
          title: pending.url ? pending.notes || 'Shared Link' : pending.text,
          url: pending.url,
          content: pending.url ? '' : pending.text,
          text: pending.url ? '' : pending.text,
          type: pending.type
        },
        prefilledTaskType: pending.type || 'TASK',
      });
    } else if (choice === 'ATTACHMENT') {
      // Create standalone attachment directly
      try {
        const attachmentData = {
          title: pending.activity || pending.text || 'Shared Link',
          url: pending.url,
          subject_id: currentSubject?.id || null
        };

        await api.attachmentsApi.create(attachmentData);
        message.success('Added to attachments!');

        // Optionally switch to attachments tab
        setActiveTab('attachments');
      } catch (error) {
        console.error('Error adding attachment:', error);
        message.error('Failed to add attachment');
      }
    }


    clearShareData();
  }, [modalState.pendingShareData, closeModal, openModal, clearShareData]);

  // Session & task handlers
  const handleAddSession = useCallback(async (sessionData) => {
    await api.sessions.create(sessionData);
    await refreshProgress();
  }, [refreshProgress]);

  const handleAddTask = useCallback(async (taskData) => {
    // Extract note linking data before creating task
    const { pendingNoteIds, pendingNewNote, ...cleanTaskData } = taskData;

    // Create the task
    const response = await api.tasks.create({
      ...cleanTaskData,
      subject_id: currentSubject?.id
    });

    // Handle note linking after task creation
    if (response && response.id) {
      try {
        // Create and link new note if provided
        if (pendingNewNote) {
          const newNote = await api.notes.create({
            ...pendingNewNote,
            subject_id: currentSubject?.id
          });
          if (newNote && newNote.id) {
            await api.noteLinks.linkToTask(response.id, newNote.id);
          }
        }

        // Link existing notes if provided
        if (pendingNoteIds && pendingNoteIds.length > 0) {
          await Promise.all(
            pendingNoteIds.map(noteId => api.noteLinks.linkToTask(response.id, noteId))
          );
        }
      } catch (error) {
        console.error('Failed to link notes:', error);
        message.warning('Task created but some notes failed to link');
      }
    }

    message.success('Task added successfully!');
    if (activeTab === 'tasks') {
      setTasksRefreshKey(prev => prev + 1);
    }
    return response;
  }, [currentSubject, activeTab]);

  const handleAddRevision = useCallback(async (revisionData) => {
    await api.revisions.create(revisionData);
    await refreshProgress();
  }, [refreshProgress]);

  const handleEditSession = useCallback((session) => {
    openModal('editSession', { editingSession: session });
  }, [openModal]);

  const handleUpdateSession = useCallback(async (sessionData) => {
    await api.sessions.update(modalState.editingSession.id, sessionData);
    await refreshProgress();
    closeModal();
    message.success('Session updated successfully!');
  }, [modalState.editingSession, refreshProgress, closeModal]);

  const handleDeleteSession = useCallback(async (sessionId) => {
    await api.sessions.delete(sessionId);
    await refreshProgress();
    message.success('Session deleted successfully!');
  }, [refreshProgress]);

  const handleReviseSession = useCallback(async (sessionId) => {
    await api.sessions.incrementRevision(sessionId);
    await refreshProgress();
    message.success('Revision count increased!');
  }, [refreshProgress]);

  const handleToggleTopic = useCallback(async (topicId, completed) => {
    await api.topics.toggleComplete(topicId, completed);
    await refreshProgress();
    message.success(completed ? 'Topic marked as completed!' : 'Topic marked as incomplete');
  }, [refreshProgress]);

  const handleMarkRevised = useCallback(async (revisionId) => {
    await api.revisions.markRevised(revisionId);
    await refreshProgress();
    message.success('Marked as revised!');
  }, [refreshProgress]);

  const handleDeleteRevision = useCallback(async (revisionId) => {
    await api.revisions.delete(revisionId);
    await refreshProgress();
    message.success('Revision item deleted');
  }, [refreshProgress]);

  const handleOpenSessionModal = useCallback((initialData = null) => {
    openModal('addSession', { sessionInitialData: initialData });
  }, [openModal]);

  const handleOpenTaskModal = useCallback((type = 'TASK') => {
    openModal('addTask', { prefilledTaskType: type });
  }, [openModal]);

  // Tab content
  const tabContent = {


    tasks: (
      <Tasks
        subjectId={currentSubject?.id}
        onLogTime={handleOpenSessionModal}
        onAddTask={() => handleOpenTaskModal('TASK')}
        refreshKey={tasksRefreshKey}
        onSessionCreated={refreshProgress}
      />
    ),
    timeline: (
      <div className="timeline-wrapper">
        <Timeline
          sessions={progress?.sessions || []}
          onUpdate={refreshProgress}
          onAddSession={() => openModal('addSession')}
          onEdit={handleEditSession}
          onDelete={handleDeleteSession}
          onRevise={handleReviseSession}
          onSessionClick={setSelectedSession}
        />
      </div>
    ),

    attachments: (
      <AttachmentsHub subjectId={currentSubject?.id} />
    ),
  };

  // 1. Check Auth Loading
  if (isCheckingAuth) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--nds-text-secondary)' }}>
          Verifying account...
        </p>
      </div>
    );
  }

  // 2. Not Logged In -> Auth Page
  if (!user) {
    return (
      <AuthPage
        onLogin={login}
        onSignup={signup}
      />
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="loading-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem', filter: 'grayscale(1)' }}>{'\u26A0\uFE0F'}</div>
        <h2 style={{ color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '1.5rem' }}>
          Connection Error
        </h2>
        <p style={{ color: 'var(--nds-text-secondary)', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
          {error.message}
        </p>
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', fontFamily: 'monospace', textAlign: 'left', maxWidth: '600px', margin: '0 auto 1.5rem', wordBreak: 'break-word' }}>
          <strong>Debug Info:</strong><br/>
          Platform: {isNativePlatform() ? 'Mobile (Capacitor)' : 'Web'}<br/>
          API URL: {import.meta.env.VITE_API_URL || '(not set - check build)'}<br/>
          Error: {error.details}
        </div>
        {error.canRetry && (
          <button
            className="btn btn-primary"
            onClick={() => { setError(null); loadSubjects(); }}
            style={{ marginTop: '1rem' }}
          >
            Retry Connection
          </button>
        )}
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.9rem', maxWidth: '600px', margin: '2rem auto 0', textAlign: 'left' }}>
          <strong>Troubleshooting Steps:</strong>
          <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li>Check your internet connection</li>
            <li>Verify the server is running</li>
            <li>Open browser console (F12) to see detailed logs</li>
            <li>For mobile: Rebuild the APK with correct VITE_API_URL</li>
          </ol>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--nds-text-secondary)' }}>
          Loading Vela...
        </p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Sidebar for Desktop */}
      <div className="desktop-sidebar-container">
        <Sidebar>
          <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>V</div>
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Vela</span>
          </div>

          <div style={{ padding: '1rem 0' }}>

            <SidebarItem
              icon={<Clipboard size={20} />}
              label="Tasks"
              active={activeTab === 'tasks'}
              onClick={() => setActiveTab('tasks')}
            />


            <SidebarItem
              icon={<Paperclip size={20} />}
              label="Attachments"
              active={activeTab === 'attachments'}
              onClick={() => setActiveTab('attachments')}
            />
            <SidebarItem
              icon={<Calendar size={20} />}
              label="Session"
              active={activeTab === 'timeline'}
              onClick={() => setActiveTab('timeline')}
            />
            <div style={{ margin: '1rem 0', height: '1px', background: 'var(--glass-border)' }}></div>
            <SidebarItem
              icon={<User size={20} />}
              label="Profile"
              active={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
            />
          </div>
        </Sidebar>
      </div>

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        <Header
          currentSubject={currentSubject}
          stats={stats}
          showStats={activeTab === 'dashboard'}
          showSubjectInfo={activeTab !== 'tasks' && activeTab !== 'timeline'}
        />

        <main className="container">
          {activeTab === 'goals' ? (
            <GoalsPage
              onBack={() => setActiveTab('profile')}
            />
          ) : activeTab === 'profile' ? (
            <ProfilePage
              user={user}
              onLogout={logout}
              onLogin={() => openModal('login')}
              onNavigateToGoals={() => setActiveTab('goals')}
              onUpdateUser={updateUser}
              onManageSubjects={() => openModal('manageSubjects')}
            />
          ) : (
            <>

              {tabContent[activeTab]}
            </>
          )}
        </main>

      </div>

      {/* Modals */}
      <CreateSubjectModal
        visible={isOpen('createSubject')}
        onClose={closeModal}
        onSubmit={createSubject}
      />

      <ManageSubjectsModal
        visible={isOpen('manageSubjects')}
        onClose={closeModal}
        subjects={subjects}
        onSelect={handleSubjectChange}
        onDelete={deleteSubject}
        onCreate={() => openModal('createSubject')}
        currentSubject={currentSubject}
      />

      <AddSessionModal
        visible={isOpen('addSession')}
        onClose={closeModal}
        onSubmit={handleAddSession}
        subjectId={currentSubject?.id}
        initialValues={modalState.sessionInitialData}
      />

      <EditSessionModal
        visible={isOpen('editSession')}
        onClose={closeModal}
        onSubmit={handleUpdateSession}
        session={modalState.editingSession}
      />

      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onDelete={handleDeleteSession}
          onEdit={(session) => {
            handleEditSession(session);
            setSelectedSession(null);
          }}
          onRevise={handleReviseSession}
        />
      )}

      <AddRevisionModal
        visible={isOpen('addRevision')}
        onClose={closeModal}
        onSubmit={handleAddRevision}
        subjectId={currentSubject?.id}
      />

      <LoginModal
        visible={isOpen('login')}
        onClose={closeModal}
        onLogin={login}
        onSwitchToSignup={() => {
          closeModal();
          openModal('signup');
        }}
      />

      <SignupModal
        visible={isOpen('signup')}
        onClose={closeModal}
        onSignup={signup}
        onSwitchToLogin={() => {
          closeModal();
          openModal('login');
        }}
      />

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddSession={() => openModal('addSession')}
      />

      <AddTaskModal
        isOpen={isOpen('addTask')}
        onClose={closeModal}
        onSubmit={handleAddTask}
        prefilledType={modalState.prefilledTaskType}
        initialValues={modalState.initialTaskShareData}
      />

      <ShareConfirmModal
        visible={isOpen('shareConfirm')}
        shareData={modalState.pendingShareData}
        onChoice={handleShareChoice}
        onCancel={() => {
          closeModal();
          clearShareData();
        }}
      />
    </div>
  );
}

function App() {
  const { user } = useUser();

  return (
    <GoalsProvider isAuthenticated={!!user}>
      <AppContent />
    </GoalsProvider>
  );
}

export default App;
