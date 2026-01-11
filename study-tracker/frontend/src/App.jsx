import React, { useState, useEffect } from 'react';
import { message } from 'antd'; // Keep only message from antd for now
import { LayoutDashboard, FileText, Calendar } from 'lucide-react';
import Header from './components/Header';
import StatsGrid from './components/StatsGrid';
import OverviewCards from './components/OverviewCards';
import Dashboard from './components/Dashboard';
import Timesheet from './components/Timesheet';
import Timeline from './components/Timeline';
import CreateSubjectModal from './components/CreateSubjectModal';
import AddSessionModal from './components/AddSessionModal';
import EditSessionModal from './components/EditSessionModal';
import AddRevisionModal from './components/AddRevisionModal';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import BottomNav from './components/BottomNav';
import ProfilePage from './components/ProfilePage';
import api from './api';
import './App.css';

// Import the design system
import './design-system/index';
import { Tabs } from './design-system';

// Capacitor for native mobile features
import { initCapacitor, isNativePlatform } from './utils/capacitor';

function App() {
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

  // Check for existing auth on mount & initialize Capacitor
  useEffect(() => {
    checkAuth();
    // Initialize Capacitor native features (push, camera, etc.)
    initCapacitor();
  }, []);

  // Load subjects on mount
  useEffect(() => {
    loadSubjects();
  }, []);

  // Load progress when current subject changes
  useEffect(() => {
    if (currentSubject) {
      loadProgress(currentSubject.id);
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
    try {
      const response = await api.auth.login(credentials);
      const userData = { name: credentials.email.split('@')[0], email: credentials.email };
      
      localStorage.setItem('authToken', response.token || 'demo-token');
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setLoginModalVisible(false);
      message.success(`Welcome back, ${userData.name}!`);
    } catch (error) {
      // For demo: allow login without backend
      const userData = { name: credentials.email.split('@')[0], email: credentials.email };
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authToken', 'demo-token');
      setUser(userData);
      setLoginModalVisible(false);
      message.success(`Welcome back, ${userData.name}!`);
    }
  };

  const handleSignup = async (userData) => {
    try {
      const response = await api.auth.signup(userData);
      const user = { name: userData.name, email: userData.email };
      
      localStorage.setItem('authToken', response.token || 'demo-token');
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setSignupModalVisible(false);
      message.success(`Welcome to Study Tracker, ${user.name}!`);
    } catch (error) {
      // For demo: allow signup without backend
      const user = { name: userData.name, email: userData.email };
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('authToken', 'demo-token');
      setUser(user);
      setSignupModalVisible(false);
      message.success(`Welcome to Study Tracker, ${user.name}!`);
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    message.info('Logged out successfully');
  };

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await api.subjects.getAll();
      setSubjects(data);
      
      if (data.length > 0 && !currentSubject) {
        setCurrentSubject(data[0]);
      }
    } catch (error) {
      console.error('Failed to load subjects:', error);
      message.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async (subjectId) => {
    try {
      const data = await api.progress.getBySubject(subjectId);
      setProgress(data);
    } catch (error) {
      console.error('Failed to load progress:', error);
      message.error('Failed to load progress data');
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
    const subject = subjects.find(s => s.id === subjectId);
    if (subject) {
      setCurrentSubject(subject);
    }
  };

  const handleToggleTopic = async (topicId, completed) => {
    try {
      await api.topics.toggleComplete(topicId, completed);
      await loadProgress(currentSubject.id);
      message.success(completed ? 'Topic marked as completed!' : 'Topic marked as incomplete');
    } catch (error) {
      console.error('Failed to toggle topic:', error);
      message.error('Failed to update topic');
    }
  };

  const handleAddSession = async (sessionData) => {
    try {
      await api.sessions.create(sessionData);
      await loadProgress(currentSubject.id);
    } catch (error) {
      console.error('Failed to add session:', error);
      throw error;
    }
  };

  const handleAddRevision = async (revisionData) => {
    try {
      await api.revisions.create(revisionData);
      await loadProgress(currentSubject.id);
    } catch (error) {
      console.error('Failed to add revision:', error);
      throw error;
    }
  };

  const handleMarkRevised = async (revisionId) => {
    try {
      await api.revisions.markRevised(revisionId);
      await loadProgress(currentSubject.id);
      message.success('Marked as revised!');
    } catch (error) {
      console.error('Failed to mark as revised:', error);
      message.error('Failed to update revision');
    }
  };

  const handleDeleteRevision = async (revisionId) => {
    try {
      await api.revisions.delete(revisionId);
      await loadProgress(currentSubject.id);
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
      await loadProgress(currentSubject.id);
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
      await loadProgress(currentSubject.id);
      message.success('Session deleted successfully!');
    } catch (error) {
      console.error('Failed to delete session:', error);
      message.error('Failed to delete session');
    }
  };

  const handleReviseSession = async (sessionId) => {
    try {
      await api.sessions.incrementRevision(sessionId);
      await loadProgress(currentSubject.id);
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

  const tabItems = [
    {
      key: 'dashboard',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LayoutDashboard size={18} />
          Dashboard
        </span>
      ),
      children: currentSubject ? (
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
    },
    {
      key: 'timesheet',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} />
          Timesheet
        </span>
      ),
      children: (
        <div className="glass-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">📝</span>
              Study Timesheet
            </h3>
            <button 
              className="btn btn-primary" 
              onClick={() => setAddSessionModalVisible(true)}
              disabled={!currentSubject}
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
    },
    {
      key: 'timeline',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} />
          Timeline
        </span>
      ),
      children: (
        <div className="glass-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">📅</span>
              Study Timeline
            </h3>
          </div>
          <Timeline sessions={progress?.sessions || []} />
        </div>
      ),
    },
  ];

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
      <Header
        currentSubject={currentSubject}
        subjects={subjects}
        onSubjectChange={handleSubjectChange}
        onCreateSubject={() => setCreateSubjectModalVisible(true)}
        stats={stats}
        user={user}
        onLogin={() => setLoginModalVisible(true)}
        onLogout={handleLogout}
      />

      {/* TABS AT THE TOP - INTEGRATED WITH HEADER */}
      <div className="tabs-container">
        <div className="container">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            className="study-tabs-nav"
          >
            {tabItems.map(item => (
              <Tabs.TabPane 
                key={item.key}
                tabKey={item.key}
                tab={item.label}
              >
                {item.children}
              </Tabs.TabPane>
            ))}
          </Tabs>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="container">
        {/* Profile Page - Full screen on mobile */}
        {activeTab === 'profile' ? (
          <ProfilePage
            user={user}
            stats={stats}
            onLogout={handleLogout}
            onLogin={() => setLoginModalVisible(true)}
          />
        ) : (
          <>
            {/* Show Overview Cards and Stats Grid ONLY on Dashboard and Timeline, NOT on Timesheet */}
            {activeTab !== 'timesheet' && (
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

        {/* Modals */}
        <CreateSubjectModal
          visible={createSubjectModalVisible}
          onClose={() => setCreateSubjectModalVisible(false)}
          onSubmit={handleCreateSubject}
        />

        <AddSessionModal
          visible={addSessionModalVisible}
          onClose={() => setAddSessionModalVisible(false)}
          onSubmit={handleAddSession}
          subjectId={currentSubject?.id}
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
      </div>
    );
  }

export default App;
