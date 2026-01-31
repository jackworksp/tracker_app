import { useState, useEffect } from 'react';
import { message } from 'antd';
import { CapacitorShareTarget } from '@capgo/capacitor-share-target';
import { LayoutDashboard, FileText, Calendar, Clipboard, Menu, User } from 'lucide-react';
import Header from './components/Header';
import StatsGrid from './components/StatsGrid';
import OverviewCards from './components/OverviewCards';
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
import FloatingActionButton from './components/FloatingActionButton';
import ProfilePage from './components/ProfilePage';
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
  
  const [subjects, setSubjects] = useState([]);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Auth state
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
                 const isUrl = sharedText.startsWith('http');
                 
                 const data = {
                     activity: isUrl ? 'Shared Link' : sharedText,
                     url: isUrl ? sharedText : '',
                     notes: result.title || '',
                     text: sharedText,
                     type: isUrl && (sharedText.includes('youtube') || sharedText.includes('youtu.be')) ? 'WATCH' : 'TASK'
                 };
                 
                 setPendingShareData(data);
                 setShareConfirmModalVisible(true);
             }
        }).catch(err => console.error('Share Intent Error:', err));
    }
  }, []);

  // ... (rest of logic)

  const handleShareChoice = (choice) => {
      setShareConfirmModalVisible(false);
      if (choice === 'SESSION') {
          handleOpenSessionModal({
              activity: pendingShareData.activity,
              url: pendingShareData.url,
              notes: pendingShareData.notes
          });
      } else if (choice === 'TASK') {
          setActiveTab('tasks');
          setInitialTaskShareData({
              title: pendingShareData.url ? pendingShareData.notes || 'Shared Link' : pendingShareData.text,
              url: pendingShareData.url,
              text: pendingShareData.url ? '' : pendingShareData.text,
              type: pendingShareData.type
          });
      }
      setPendingShareData(null);
  };


  // Load subjects on mount
  useEffect(() => {
    loadSubjects();
  }, []);

  // Load progress when current subject changes
  useEffect(() => {
    if (currentSubject) {
      loadProgress(currentSubject.id);
    } else {
      // Load all progress when no subject is selected (global view)
      loadProgress(null);
    }
  }, [currentSubject]);
  // Auth functions
  const checkAuth = async () => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
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
      console.log('App: loadSubjects started');
      setLoading(true);
      const data = await api.subjects.getAll();
      console.log('App: subjects loaded', data);
      setSubjects(data);
      
      // Try to restore last selected subject
      
      let homeSubject = data.find(s => s.name === 'Home');
      const savedSubjectId = localStorage.getItem('lastSubjectId');
      
      // Auto-create Home subject if it doesn't exist
      if (!homeSubject && data.length >= 0) { // Check if we should create it
          try {
              console.log('App: "Home" subject missing, creating it automatically...');
              homeSubject = await api.subjects.create({
                  name: 'Home',
                  description: 'General dashboard',
                  icon: '🏠',
                  color: '#6B46C1'
              });
              // Add to local list so we can select it immediately
              data.push(homeSubject);
              setSubjects([...data]); // Update state
          } catch (err) {
              console.error('App: Failed to auto-create Home subject', err);
          }
      }

      if (savedSubjectId) {
        const savedSubject = data.find(s => s.id.toString() === savedSubjectId);
        if (savedSubject) {
            console.log('App: restoring saved subject', savedSubject);
            setCurrentSubject(savedSubject);
        } else {
             console.log('App: saved subject ID not found in loaded subjects');
             // Fallback: Use Home (which we just ensured exists)
             if (homeSubject) {
                 console.log('App: auto-selecting Home subject (fallback)');
                 setCurrentSubject(homeSubject);
                 localStorage.setItem('lastSubjectId', homeSubject.id);
             } else if (data.length > 0) {
                 setCurrentSubject(data[0]);
                 localStorage.setItem('lastSubjectId', data[0].id);
             }
        }
      } else {
        // No saved ID found. Select Home.
        if (homeSubject) {
            console.log('App: no saved subject ID, selecting Home');
            setCurrentSubject(homeSubject);
            localStorage.setItem('lastSubjectId', homeSubject.id);
        } else if (data.length > 0) {
            setCurrentSubject(data[0]);
            localStorage.setItem('lastSubjectId', data[0].id);
        }
      }

    } catch (error) {
      console.error('Failed to load subjects:', error);
      message.error('Failed to load subjects');
    } finally {
      setLoading(false);
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
        // Tasks component will reload automatically
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
      <Dashboard
        progress={progress}
        onToggleTopic={handleToggleTopic}
        onAddRevision={() => setAddRevisionModalVisible(true)}
        onMarkRevised={handleMarkRevised}
        onDeleteRevision={handleDeleteRevision}
        onAddSession={() => setAddSessionModalVisible(true)}
      />
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
        />
      </div>
    ),
    tasks: (
      <Tasks 
        subjectId={currentSubject?.id} 
        onLogTime={handleOpenSessionModal}
      />
    ),
    timeline: (
      <div className="glass-card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="card-icon">📅</span>
            Study Timeline
          </h3>
        </div>
        <Timeline
          sessions={progress?.sessions || []}
          onUpdate={fetchProgress}
          onAddSession={() => setAddSessionModalVisible(true)}
        />
      </div>
    ),
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--nds-text-secondary)' }}>
          Loading study tracker...
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
              label="Timeline" 
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
          showSubjectInfo={activeTab !== 'tasks'}
        />

        <main className="container">
          {/* Profile Page - Full screen on mobile */}
          {activeTab === 'profile' ? (
            <ProfilePage
              user={user}
              onLogout={handleLogout}
              onLogin={() => setLoginModalVisible(true)}
            />
          ) : (
            <>
              {/* Show Overview Cards and Stats Grid ONLY on Dashboard */}
              {activeTab === 'dashboard' && (
                <>
                  {/* Overview Cards */}
                  <div style={{ marginBottom: '2rem' }}>
                    <OverviewCards 
                      progress={progress} 
                      stats={stats}
                      onAddSession={() => setAddSessionModalVisible(true)}
                    />
                  </div>

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

      {/* Floating Action Button - Hidden on Profile Tab */}
      {activeTab !== 'profile' && (
        <FloatingActionButton onAddTask={handleOpenTaskModal} />
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={addTaskModalVisible}
        onClose={() => setAddTaskModalVisible(false)}
        onSubmit={handleAddTask}
        prefilledType={prefilledTaskType}
      />
    </div>
  );
}

export default App;
