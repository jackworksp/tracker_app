import { useState, useEffect } from 'react';
import { message } from 'antd';
import { CapacitorShareTarget } from '@capgo/capacitor-share-target';
import { LayoutDashboard, FileText, Calendar, Clipboard, Menu, User } from 'lucide-react';
import Header from './components/Header';
import StatsGrid from './components/StatsGrid';

import Dashboard from './components/Dashboard';
import Timesheet from './components/Timesheet';
import Timeline from './components/Timeline';
import Tasks from './components/Tasks';
import CreateSubjectModal from './components/CreateSubjectModal';
import AddSessionModal from './components/AddSessionModal';
import EditSessionModal from './components/EditSessionModal';
import AddRevisionModal from './components/AddRevisionModal';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import BottomNav from './components/BottomNav';
import AddTaskModal from './components/AddTaskModal';
import ProfilePage from './components/ProfilePage';
import GoalsPage from './components/GoalsPage';
import AuthPage from './components/AuthPage';
import ShareConfirmModal from './components/ShareConfirmModal';
import api from './api';
import './App.css';

// Import the design system
import './design-system/index';
// Import Sidebar components
import { Sidebar, SidebarItem, SidebarGroup } from './design-system';

// Capacitor for native mobile features
import { initCapacitor, isNativePlatform } from './utils/capacitor';

function App() {
  console.log('🚀 App component mounting...');
  console.log('📱 Platform:', isNativePlatform() ? 'Native Mobile (Capacitor)' : 'Web Browser');
  console.log('🌐 API Base URL will be:', import.meta.env.VITE_API_URL || '(using default from api.js)');

  const [subjects, setSubjects] = useState([]);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [progress, setProgress] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true); // Content loading
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Auth state
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Authentication loading
  const [user, setUser] = useState(null);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [signupModalVisible, setSignupModalVisible] = useState(false);
  
  // Modal states
  const [createSubjectModalVisible, setCreateSubjectModalVisible] = useState(false);
  const [addSessionModalVisible, setAddSessionModalVisible] = useState(false);
  const [addRevisionModalVisible, setAddRevisionModalVisible] = useState(false);
  const [editSessionModalVisible, setEditSessionModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);
  const [prefilledTaskType, setPrefilledTaskType] = useState('TASK');
  const [sessionInitialData, setSessionInitialData] = useState(null);
  const [tasksRefreshKey, setTasksRefreshKey] = useState(0); // For forcing Tasks reload

  // Share Intent State
  const [shareConfirmModalVisible, setShareConfirmModalVisible] = useState(false);
  const [pendingShareData, setPendingShareData] = useState(null);
  const [initialTaskShareData, setInitialTaskShareData] = useState(null);

  // Check for existing auth on mount & initialize Capacitor
  useEffect(() => {
    checkAuth();
    // Initialize Capacitor native features (push, camera, etc.)
    initCapacitor();
    

    if (window.Capacitor) {
        // Handle Shared Intents (from other apps)
        CapacitorShareTarget.addListener('shareReceived', (result) => {
             console.log('🚀 Received Share Intent:', result);
             if (result.texts && result.texts.length > 0) {
                 const sharedText = result.texts[0];
                 
                 // Smart Parsing for YouTube/Links
                 // Case 1: "Video Title https://youtu.be/..." (Common from Android YouTube Share)
                 // Case 2: Just URL
                 // Case 3: Just Text
                 
                 const urlRegex = /(https?:\/\/[^\s]+)/;
                 const urlMatch = sharedText.match(urlRegex);
                 
                 let url = urlMatch ? urlMatch[0] : '';
                 let title = result.title || ''; // Default to Intent Subject/Title
                 let text = sharedText;
                 
                 // If there is a URL, assume the non-URL part might be the title
                 if (url) {
                     // Remove URL from text to get potential title/comment
                     const potentialTitle = sharedText.replace(url, '').trim();
                     if (potentialTitle && !title) {
                         title = potentialTitle;
                     }
                     // If still no title and it looks like just a URL, set generic
                     if (!title) {
                         title = 'Shared Link';
                     }
                 } else {
                     // No URL, just text
                     title = sharedText.length > 50 ? sharedText.substring(0, 50) + '...' : sharedText;
                 }

                 // Handle YouTube Shorts specifically (convert to regular watch URL if needed for better support, or just detect)
                 const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
                 const isShorts = url.includes('youtube.com/shorts/');
                 
                 const data = {
                     activity: title,
                     url: url,
                     notes: title === 'Shared Link' ? '' : title, // If title was extracted from text, use it as notes too? Or keep clean.
                     text: text,
                     type: isYouTube ? 'WATCH' : 'TASK'
                 };
                 
                 // If we successfully extracted a title from the text body (common in YouTube share), prioritize it
                 if (url && sharedText.includes(url)) {
                     // Multi-line share often looks like: "Amazing Video Title\nhttps://youtu.be/xyz"
                     // The logic above handles it via replace, but let's be explicit about multi-line
                     const lines = sharedText.split(/\r?\n/).filter(line => line.trim() !== '');
                     if (lines.length > 1) {
                        // Likely [Title, URL] or [URL, Title]
                        const lineWithUrl = lines.findIndex(l => l.includes(url));
                        if (lineWithUrl > -1) {
                            // The other line is likely the title
                            const titleLine = lines.find((l, i) => i !== lineWithUrl);
                            if (titleLine) {
                                data.activity = titleLine.trim();
                                data.notes = titleLine.trim(); // Also set as notes to preserve context
                            }
                        }
                     }
                 }

                 setPendingShareData(data);
                 setShareConfirmModalVisible(true);
             }
        }).catch(err => console.error('Share Intent Error:', err));
    }
  }, []);

  // ... (rest of logic)

  const handleShareChoice = (choice) => {
      setShareConfirmModalVisible(false);
      // Safety scroll unlock in case modal cleanup is delayed
      document.body.style.overflow = '';
      
      if (choice === 'SESSION') {
          handleOpenSessionModal({
              activity: pendingShareData.activity,
              url: pendingShareData.url,
              notes: pendingShareData.notes
          });
      } else if (choice === 'TASK') {
          setActiveTab('tasks');
          const shareData = {
              title: pendingShareData.url ? pendingShareData.notes || 'Shared Link' : pendingShareData.text,
              url: pendingShareData.url,
              content: pendingShareData.url ? '' : pendingShareData.text,
              text: pendingShareData.url ? '' : pendingShareData.text,
              type: pendingShareData.type
          };
          setInitialTaskShareData(shareData);
          setPrefilledTaskType(pendingShareData.type || 'TASK');
          setAddTaskModalVisible(true);
      }
      setPendingShareData(null);
  };


  // Load subjects and goals ONLY when user is authenticated
  useEffect(() => {
    if (user) {
        loadSubjects();
        loadGoals();
    }
  }, [user]);

  // Load progress when current subject changes (ONLY if user is authenticated)
  useEffect(() => {
    if (!user) return; // Don't load progress if not authenticated
    
    if (currentSubject) {
      loadProgress(currentSubject.id);
    } else {
      // Load all progress when no subject is selected (global view)
      loadProgress(null);
    }
  }, [currentSubject, user]);
  // Auth functions
  const checkAuth = async () => {
    setIsCheckingAuth(true);
    try {
      // For now, clear all auth data to force fresh login
      // This prevents issues with invalid/expired tokens
      console.log('🔄 Clearing auth data to force fresh login');
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      setUser(null);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogin = async (credentials) => {
    const response = await api.auth.login(credentials);
    const userData = response.user;
    
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    setUser(userData);
    setLoginModalVisible(false);
    message.success(`Welcome back, ${userData.name}!`);
  };

  const handleSignup = async (userData) => {
    const response = await api.auth.signup(userData);
    const user = response.user;
    
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(user));
    
    setUser(user);
    setSignupModalVisible(false);
    message.success(`Welcome to Study Tracker, ${user.name}!`);
  };

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    message.info('Logged out successfully');
  };
  const loadSubjects = async () => {
    try {
      console.log('📡 App: Starting loadSubjects...');
      console.log('📡 App: Fetching from API...');
      setLoading(true);
      setError(null); // Clear previous errors

      const response = await api.subjects.getAll();
      // Backend returns { data: [...], pagination: ... }
      const data = response.data || response; 
      
      console.log('✅ App: Subjects loaded successfully:', data.length, 'subjects');
      console.log('📊 App: Subject data:', data);
      setSubjects(data);

      // Try to restore last selected subject

      let homeSubject = data.find(s => s.name === 'Home');
      const savedSubjectId = localStorage.getItem('lastSubjectId');

      // Auto-create Home subject if it doesn't exist
      if (!homeSubject && data.length >= 0) { // Check if we should create it
          try {
              console.log('🏠 App: "Home" subject missing, creating it automatically...');
              homeSubject = await api.subjects.create({
                  name: 'Home',
                  description: 'General dashboard',
                  icon: '🏠',
                  color: '#6B46C1'
              });
              console.log('✅ App: Home subject created:', homeSubject);
              // Add to local list so we can select it immediately
              data.push(homeSubject);
              setSubjects([...data]); // Update state
          } catch (err) {
              console.error('❌ App: Failed to auto-create Home subject', err);
          }
      }

      if (savedSubjectId) {
        const savedSubject = data.find(s => s.id.toString() === savedSubjectId);
        if (savedSubject) {
            console.log('✅ App: Restoring saved subject:', savedSubject.name);
            setCurrentSubject(savedSubject);
        } else {
             console.log('⚠️  App: Saved subject ID not found in loaded subjects');
             // Fallback: Use Home (which we just ensured exists)
             if (homeSubject) {
                 console.log('🏠 App: Auto-selecting Home subject (fallback)');
                 setCurrentSubject(homeSubject);
                 localStorage.setItem('lastSubjectId', homeSubject.id);
             } else if (data.length > 0) {
                 console.log('📌 App: Selecting first available subject');
                 setCurrentSubject(data[0]);
                 localStorage.setItem('lastSubjectId', data[0].id);
             }
        }
      } else {
        // No saved ID found. Select Home.
        if (homeSubject) {
            console.log('🏠 App: No saved subject ID, selecting Home');
            setCurrentSubject(homeSubject);
            localStorage.setItem('lastSubjectId', homeSubject.id);
        } else if (data.length > 0) {
            console.log('📌 App: Selecting first available subject');
            setCurrentSubject(data[0]);
            localStorage.setItem('lastSubjectId', data[0].id);
        }
      }

      console.log('✅ App: Initialization complete');

    } catch (error) {
      console.error('❌ App: CRITICAL ERROR - Failed to load subjects:', error);
      console.error('❌ App: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      const errorMessage = `Failed to connect to server: ${error.message}`;
      setError({
        message: errorMessage,
        details: error.toString(),
        canRetry: true
      });
      message.error(errorMessage);
    } finally {
      setLoading(false);
      console.log('🏁 App: loadSubjects finished (loading state cleared)');
    }
  };

  const loadProgress = async (subjectId) => {
    console.log('App: loadProgress called for subjectId', subjectId);
    try {
      const data = await api.progress.getBySubject(subjectId);
      console.log('App: progress loaded', data);
      setProgress(data);
    } catch (error) {
      console.error('Failed to load progress:', error);
      message.error(`Failed to load progress: ${error.message}`);
    }
  };

  const loadGoals = async () => {
    try {
      console.log('📡 App: Loading goals...');
      const data = await api.goals.getAll();
      console.log('✅ App: Goals loaded:', data.length, 'goals');
      setGoals(data);
    } catch (error) {
      console.error('Failed to load goals:', error);
      // Don't show error message as this is not critical
    }
  };

  const handleCreateSubject = async (values) => {
    try {
      const newSubject = await api.subjects.create({
        name: values.name,
        description: values.description,
        icon: values.icon,
        color: values.color,
      });

      // Seed with AWS topics if requested
      if (values.seedWithAWS) {
        await api.subjects.seedTopics(newSubject.id);
      }

      await loadSubjects();
      setCurrentSubject(newSubject);
    } catch (error) {
      console.error('Failed to create subject:', error);
      throw error;
    }
  };

  const handleSubjectChange = (subjectId) => {
    if (!subjectId) {
      setCurrentSubject(null);
      localStorage.removeItem('lastSubjectId');
      return;
    }
    // Use == for comparison to handle both string (from select) and int (from DB) IDs
    const subject = subjects.find(s => String(s.id) === String(subjectId));
    if (subject) {
      setCurrentSubject(subject);
      localStorage.setItem('lastSubjectId', subject.id);
    }
  };

  const handleToggleTopic = async (topicId, completed) => {
    try {
      await api.topics.toggleComplete(topicId, completed);
      await loadProgress(currentSubject?.id);
      message.success(completed ? 'Topic marked as completed!' : 'Topic marked as incomplete');
    } catch (error) {
      console.error('Failed to toggle topic:', error);
      message.error('Failed to update topic');
    }
  };

  const handleAddSession = async (sessionData) => {
    try {
      await api.sessions.create(sessionData);
      await loadProgress(currentSubject?.id);
    } catch (error) {
      console.error('Failed to add session:', error);
      throw error;
    }
  };

  const handleOpenSessionModal = (initialData = null) => {
    setSessionInitialData(initialData);
    setAddSessionModalVisible(true);
  };

  const handleAddTask = async (taskData) => {
    try {
      const response = await api.tasks.create({
        ...taskData,
        subject_id: currentSubject?.id
      });
      message.success('Task added successfully!');
      // Reload tasks if on tasks tab
      if (activeTab === 'tasks') {
        setTasksRefreshKey(prev => prev + 1);
      }
      return response;
    } catch (error) {
      console.error('Failed to add task:', error);
      message.error('Failed to add task');
      throw error;
    }
  };

  const handleOpenTaskModal = (type = 'TASK') => {
    setPrefilledTaskType(type);
    setAddTaskModalVisible(true);
  };

  const handleAddRevision = async (revisionData) => {
    try {
      await api.revisions.create(revisionData);
      await loadProgress(currentSubject?.id);
    } catch (error) {
      console.error('Failed to add revision:', error);
      throw error;
    }
  };

  const handleMarkRevised = async (revisionId) => {
    try {
      await api.revisions.markRevised(revisionId);
      await loadProgress(currentSubject?.id);
      message.success('Marked as revised!');
    } catch (error) {
      console.error('Failed to mark as revised:', error);
      message.error('Failed to update revision');
    }
  };

  const handleDeleteRevision = async (revisionId) => {
    try {
      await api.revisions.delete(revisionId);
      await loadProgress(currentSubject?.id);
      message.success('Revision item deleted');
    } catch (error) {
      console.error('Failed to delete revision:', error);
      message.error('Failed to delete revision');
    }
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setEditSessionModalVisible(true);
  };

  const handleUpdateSession = async (sessionData) => {
    try {
      await api.sessions.update(editingSession.id, sessionData);
      await loadProgress(currentSubject?.id);
      setEditSessionModalVisible(false);
      setEditingSession(null);
      message.success('Session updated successfully!');
    } catch (error) {
      console.error('Failed to update session:', error);
      throw error;
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await api.sessions.delete(sessionId);
      await loadProgress(currentSubject?.id);
      message.success('Session deleted successfully!');
    } catch (error) {
      console.error('Failed to delete session:', error);
      message.error('Failed to delete session');
    }
  };

  const handleReviseSession = async (sessionId) => {
    try {
      await api.sessions.incrementRevision(sessionId);
      await loadProgress(currentSubject?.id);
      message.success('Revision count increased!');
    } catch (error) {
      console.error('Failed to increment revision:', error);
      message.error('Failed to update revision count');
    }
  };

  // Calculate stats
  const calculateStats = () => {
    if (!progress) {
      return {
        streak: 0,
        totalHours: 0,
        completedTopics: 0,
        studyDays: 0,
        totalTopics: 0,
        totalSessions: 0,
        examReadiness: 0,
      };
    }

    const sessions = progress.sessions || [];
    const topics = progress.topics || [];
    
    const totalMinutes = sessions.reduce((sum, s) => sum + s.time_spent, 0);
    const totalHours = Math.round(totalMinutes / 60);
    const completedTopics = topics.filter(t => t.completed).length;
    const totalTopics = topics.length;
    const examReadiness = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    
    // Calculate unique study days
    const uniqueDays = new Set(sessions.map(s => s.date)).size;
    
    // Simple streak calculation (consecutive days from today)
    const sortedDates = [...new Set(sessions.map(s => s.date))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    if (sortedDates.length > 0) {
      let currentDate = new Date(today);
      for (const dateStr of sortedDates) {
        const sessionDate = new Date(dateStr);
        const diffDays = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= streak + 1) {
          streak++;
          currentDate = sessionDate;
        } else {
          break;
        }
      }
    }

    return {
      streak,
      totalHours,
      completedTopics,
      studyDays: uniqueDays,
      totalTopics,
      totalSessions: sessions.length,
      examReadiness,
    };
  };

  const stats = calculateStats();

  const tabContent = {
    dashboard: currentSubject ? (
      <Dashboard />
    ) : (
      <div className="empty-state-container">
        <p>Please create or select a subject to view dashboard</p>
      </div>
    ),
    timesheet: (
      <div className="glass-card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="card-icon">📝</span>
            Study Timesheet
          </h3>
          <button 
            className="btn btn-primary" 
            onClick={() => {
                setAddSessionModalVisible(true);
            }}
          >
            <span>➕</span>
            Add Study Session
          </button>
        </div>
        <Timesheet
          sessions={progress?.sessions || []}
          onEdit={handleEditSession}
          onDelete={handleDeleteSession}
          onRevise={handleReviseSession}
          goals={goals}
        />
      </div>
    ),
    tasks: (
      <Tasks
        subjectId={currentSubject?.id}
        onLogTime={handleOpenSessionModal}
        onAddTask={() => handleOpenTaskModal('TASK')}
        refreshKey={tasksRefreshKey}
        goals={goals}
        onSessionCreated={() => {
            console.log('App: Session created from Tasks, refreshing progress...');
            loadProgress(currentSubject?.id);
        }}
      />
    ),
    timeline: (
      <Timeline
        sessions={progress?.sessions || []}
        onUpdate={() => loadProgress(currentSubject?.id)}
        onAddSession={() => setAddSessionModalVisible(true)}
        onEdit={handleEditSession}
        onDelete={handleDeleteSession}
        onRevise={handleReviseSession}
        goals={goals}
      />
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
            onLogin={handleLogin}
            onSignup={handleSignup}
        />
    );
  }

  // Error Screen - Show when there's a critical error
  if (error) {
    return (
      <div className="loading-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem',
          filter: 'grayscale(1)'
        }}>⚠️</div>
        <h2 style={{
          color: 'var(--color-danger)',
          marginBottom: '1rem',
          fontSize: '1.5rem'
        }}>
          Connection Error
        </h2>
        <p style={{
          color: 'var(--nds-text-secondary)',
          marginBottom: '1.5rem',
          maxWidth: '500px',
          margin: '0 auto 1.5rem'
        }}>
          {error.message}
        </p>

        <div style={{
          background: 'rgba(0,0,0,0.2)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          fontSize: '0.85rem',
          fontFamily: 'monospace',
          textAlign: 'left',
          maxWidth: '600px',
          margin: '0 auto 1.5rem',
          wordBreak: 'break-word'
        }}>
          <strong>Debug Info:</strong><br/>
          Platform: {isNativePlatform() ? 'Mobile (Capacitor)' : 'Web'}<br/>
          API URL: {import.meta.env.VITE_API_URL || '(not set - check build)'}<br/>
          Error: {error.details}
        </div>

        {error.canRetry && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setError(null);
              loadSubjects();
            }}
            style={{ marginTop: '1rem' }}
          >
            🔄 Retry Connection
          </button>
        )}

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          fontSize: '0.9rem',
          maxWidth: '600px',
          margin: '2rem auto 0',
          textAlign: 'left'
        }}>
          <strong>📋 Troubleshooting Steps:</strong>
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
          Loading study tracker...
        </p>
        <p style={{
          marginTop: '0.5rem',
          color: 'var(--nds-text-secondary)',
          fontSize: '0.85rem',
          opacity: 0.7
        }}>
          Check console for detailed logs (F12)
        </p>
      </div>
    );
  }

  // Show Auth Page if user is not logged in
  if (!user) {
    return <AuthPage onLogin={handleLogin} onSignup={handleSignup} />;
  }

  return (
    <div className="app">
      {/* Sidebar for Desktop */}
      <div className="desktop-sidebar-container">
        <Sidebar>
          <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>ST</div>
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>StudyTracker</span>
          </div>
          
          <div style={{ padding: '1rem 0' }}>
            <SidebarItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
            />
            <SidebarItem 
              icon={<Clipboard size={20} />} 
              label="Tasks" 
              active={activeTab === 'tasks'}
              onClick={() => setActiveTab('tasks')}
            />
            <SidebarItem 
              icon={<FileText size={20} />} 
              label="Timesheet" 
              active={activeTab === 'timesheet'}
              onClick={() => setActiveTab('timesheet')}
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
          subjects={subjects}
          onSubjectChange={handleSubjectChange}
          onCreateSubject={() => setCreateSubjectModalVisible(true)}
          stats={stats}
          user={user}
          onLogin={() => setLoginModalVisible(true)}
          onLogout={handleLogout}
          showStats={activeTab === 'dashboard'}
          showControls={activeTab !== 'tasks'}
          showSubjectInfo={activeTab !== 'tasks' && activeTab !== 'timeline'}
        />

        <main className="container">
          {/* Goals Page - Full screen */}
          {activeTab === 'goals' ? (
            <GoalsPage
              onBack={() => setActiveTab('profile')}
            />
          ) : activeTab === 'profile' ? (
            /* Profile Page - Full screen on mobile */
            <ProfilePage
              user={user}
              onLogout={handleLogout}
              onLogin={() => setLoginModalVisible(true)}
              onNavigateToGoals={() => setActiveTab('goals')}
            />
          ) : (
            <>
              {/* Show Overview Cards and Stats Grid ONLY on Dashboard */}
              {activeTab === 'dashboard' && (
                <>

                  {/* Stats Grid */}
                  <div style={{ marginBottom: '2rem' }}>
                    <StatsGrid stats={stats} />
                  </div>
                </>
              )}
              
              {/* Tab Content */}
              {tabContent[activeTab]}
            </>
          )}
        </main>

        <footer className="footer">
          <div className="container">
            <p className="footer-text">
              Made with <span className="footer-heart">❤️</span> for learning excellence
            </p>
            <p className="footer-text" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Last Updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <CreateSubjectModal
        visible={createSubjectModalVisible}
        onClose={() => setCreateSubjectModalVisible(false)}
        onSubmit={handleCreateSubject}
      />

      <AddSessionModal
        visible={addSessionModalVisible}
        onClose={() => {
            setAddSessionModalVisible(false);
            setSessionInitialData(null);
        }}
        onSubmit={handleAddSession}
        subjectId={currentSubject?.id}
        initialValues={sessionInitialData}
        goals={goals}
      />

      <EditSessionModal
        visible={editSessionModalVisible}
        onClose={() => {
          setEditSessionModalVisible(false);
          setEditingSession(null);
        }}
        onSubmit={handleUpdateSession}
        session={editingSession}
      />

      <AddRevisionModal
        visible={addRevisionModalVisible}
        onClose={() => setAddRevisionModalVisible(false)}
        onSubmit={handleAddRevision}
        subjectId={currentSubject?.id}
      />

      <LoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onLogin={handleLogin}
        onSwitchToSignup={() => {
          setLoginModalVisible(false);
          setSignupModalVisible(true);
        }}
      />

      <SignupModal
        visible={signupModalVisible}
        onClose={() => setSignupModalVisible(false)}
        onSignup={handleSignup}
        onSwitchToLogin={() => {
          setSignupModalVisible(false);
          setLoginModalVisible(true);
        }}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddSession={() => setAddSessionModalVisible(true)}
      />

      <AddTaskModal
        isOpen={addTaskModalVisible}
        onClose={() => setAddTaskModalVisible(false)}
        onSubmit={handleAddTask}
        prefilledType={prefilledTaskType}
        initialValues={initialTaskShareData}
        goals={goals}
      />

      {/* Share Confirmation Modal */}
      <ShareConfirmModal
        visible={shareConfirmModalVisible}
        shareData={pendingShareData}
        onChoice={handleShareChoice}
        onCancel={() => {
          setShareConfirmModalVisible(false);
          setPendingShareData(null);
        }}
      />
    </div>
  );
}

export default App;
