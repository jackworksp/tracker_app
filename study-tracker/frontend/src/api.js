// API Base URL - uses environment variable if set, otherwise relative path
// For mobile app, use the EC2 IP address with /trackapp prefix
const API_BASE = import.meta.env.VITE_API_URL || 'http://54.146.252.207/trackapp/api';

// Demo mode - automatically enabled if API requests fail
let isDemoMode = false;
let demoModeChecked = false;

// Local storage keys for demo mode
const STORAGE_KEYS = {
  subjects: 'tasktracker_subjects',
  topics: 'tasktracker_topics',
  sessions: 'tasktracker_sessions',
  revisions: 'tasktracker_revisions',
  user: 'user',
  token: 'authToken'
};

// Get data from local storage
const getLocalData = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS[key]);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Save data to local storage
const saveLocalData = (key, data) => {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to local storage:', e);
  }
};

// Generate a simple ID
const generateId = () => Date.now() + Math.random().toString(36).substr(2, 9);

// Check if API is available, switch to demo mode if not
const ensureApiMode = async () => {
  if (demoModeChecked) return;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${API_BASE}/subjects`, { 
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      isDemoMode = true;
      console.log('API returned error, using demo mode');
    }
  } catch (error) {
    isDemoMode = true;
    console.log('API not available, using demo mode. Error:', error.message);
  }
  
  demoModeChecked = true;
  
  // Initialize demo data if needed
  if (isDemoMode && getLocalData('subjects').length === 0) {
    saveLocalData('subjects', [
      { id: 'demo-1', name: 'My Study Subject', description: 'Demo subject - add your topics here!', icon: '📚', color: '#6B46C1', created_at: new Date().toISOString() }
    ]);
  }
};

// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Safe fetch with demo mode fallback
async function safeFetch(url, options = {}, demoFallback) {
  await ensureApiMode();
  
  if (isDemoMode && demoFallback) {
    return demoFallback();
  }
  
  try {
    const response = await fetch(url, options);
    return handleResponse(response);
  } catch (error) {
    // If fetch fails, try demo fallback
    if (demoFallback) {
      isDemoMode = true;
      return demoFallback();
    }
    throw error;
  }
}

// Subjects API
export const subjectsApi = {
  // Get all subjects
  getAll: async () => {
    return safeFetch(
      `${API_BASE}/subjects`,
      {},
      () => getLocalData('subjects')
    );
  },

  // Get single subject with all data
  getById: async (id) => {
    return safeFetch(
      `${API_BASE}/subjects/${id}`,
      {},
      () => {
        const subjects = getLocalData('subjects');
        return subjects.find(s => s.id === id) || null;
      }
    );
  },

  // Create new subject
  create: async (data) => {
    return safeFetch(
      `${API_BASE}/subjects`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const subjects = getLocalData('subjects');
        const newSubject = {
          id: generateId(),
          ...data,
          created_at: new Date().toISOString()
        };
        subjects.push(newSubject);
        saveLocalData('subjects', subjects);
        return newSubject;
      }
    );
  },

  // Update subject
  update: async (id, data) => {
    return safeFetch(
      `${API_BASE}/subjects/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const subjects = getLocalData('subjects');
        const index = subjects.findIndex(s => s.id === id);
        if (index >= 0) {
          subjects[index] = { ...subjects[index], ...data };
          saveLocalData('subjects', subjects);
          return subjects[index];
        }
        throw new Error('Subject not found');
      }
    );
  },

  // Delete subject
  delete: async (id) => {
    return safeFetch(
      `${API_BASE}/subjects/${id}`,
      { method: 'DELETE' },
      () => {
        const subjects = getLocalData('subjects').filter(s => s.id !== id);
        saveLocalData('subjects', subjects);
        return { success: true };
      }
    );
  },

  // Seed AWS topics
  seedTopics: async (id) => {
    return safeFetch(
      `${API_BASE}/subjects/${id}/seed`,
      { method: 'POST' },
      () => {
        // Add some demo topics
        const topics = getLocalData('topics');
        const demoTopics = [
          { id: generateId(), subject_id: id, name: 'Getting Started', completed: false },
          { id: generateId(), subject_id: id, name: 'Core Concepts', completed: false },
          { id: generateId(), subject_id: id, name: 'Advanced Topics', completed: false },
        ];
        topics.push(...demoTopics);
        saveLocalData('topics', topics);
        return { topics: demoTopics };
      }
    );
  },
};

// Progress API
export const progressApi = {
  // Get all progress for a subject
  getBySubject: async (subjectId) => {
    return safeFetch(
      `${API_BASE}/progress/${subjectId}`,
      {},
      () => {
        return {
          topics: getLocalData('topics').filter(t => t.subject_id === subjectId),
          sessions: getLocalData('sessions').filter(s => s.subject_id === subjectId),
          revisions: getLocalData('revisions').filter(r => r.subject_id === subjectId),
        };
      }
    );
  },
};

// Topics API
export const topicsApi = {
  // Create topic
  create: async (data) => {
    return safeFetch(
      `${API_BASE}/progress/topics`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const topics = getLocalData('topics');
        const newTopic = { id: generateId(), ...data, completed: false };
        topics.push(newTopic);
        saveLocalData('topics', topics);
        return newTopic;
      }
    );
  },

  // Update topic
  update: async (id, data) => {
    return safeFetch(
      `${API_BASE}/progress/topics/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const topics = getLocalData('topics');
        const index = topics.findIndex(t => t.id === id);
        if (index >= 0) {
          topics[index] = { ...topics[index], ...data };
          saveLocalData('topics', topics);
          return topics[index];
        }
        throw new Error('Topic not found');
      }
    );
  },

  // Toggle topic completion
  toggleComplete: async (id, completed) => {
    return topicsApi.update(id, { completed });
  },
};

// Study Sessions API
export const sessionsApi = {
  // Create study session
  create: async (data) => {
    return safeFetch(
      `${API_BASE}/progress/sessions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const sessions = getLocalData('sessions');
        const newSession = { 
          id: generateId(), 
          ...data, 
          revision_count: 0,
          created_at: new Date().toISOString() 
        };
        sessions.push(newSession);
        saveLocalData('sessions', sessions);
        return newSession;
      }
    );
  },

  // Update study session
  update: async (id, data) => {
    return safeFetch(
      `${API_BASE}/progress/sessions/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const sessions = getLocalData('sessions');
        const index = sessions.findIndex(s => s.id === id);
        if (index >= 0) {
          sessions[index] = { ...sessions[index], ...data };
          saveLocalData('sessions', sessions);
          return sessions[index];
        }
        throw new Error('Session not found');
      }
    );
  },

  // Delete study session
  delete: async (id) => {
    return safeFetch(
      `${API_BASE}/progress/sessions/${id}`,
      { method: 'DELETE' },
      () => {
        const sessions = getLocalData('sessions').filter(s => s.id !== id);
        saveLocalData('sessions', sessions);
        return { success: true };
      }
    );
  },

  // Increment revision count
  incrementRevision: async (id) => {
    return safeFetch(
      `${API_BASE}/progress/sessions/${id}/revise`,
      { method: 'POST' },
      () => {
        const sessions = getLocalData('sessions');
        const index = sessions.findIndex(s => s.id === id);
        if (index >= 0) {
          sessions[index].revision_count = (sessions[index].revision_count || 0) + 1;
          saveLocalData('sessions', sessions);
          return sessions[index];
        }
        throw new Error('Session not found');
      }
    );
  },
};

// Revisions API
export const revisionsApi = {
  // Create revision item
  create: async (data) => {
    return safeFetch(
      `${API_BASE}/progress/revisions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => {
        const revisions = getLocalData('revisions');
        const newRevision = { 
          id: generateId(), 
          ...data, 
          count: 0,
          last_revised: null,
          created_at: new Date().toISOString() 
        };
        revisions.push(newRevision);
        saveLocalData('revisions', revisions);
        return newRevision;
      }
    );
  },

  // Mark as revised
  markRevised: async (id) => {
    return safeFetch(
      `${API_BASE}/progress/revisions/${id}`,
      { method: 'PUT' },
      () => {
        const revisions = getLocalData('revisions');
        const index = revisions.findIndex(r => r.id === id);
        if (index >= 0) {
          revisions[index].count = (revisions[index].count || 0) + 1;
          revisions[index].last_revised = new Date().toISOString();
          saveLocalData('revisions', revisions);
          return revisions[index];
        }
        throw new Error('Revision not found');
      }
    );
  },

  // Delete revision item
  delete: async (id) => {
    return safeFetch(
      `${API_BASE}/progress/revisions/${id}`,
      { method: 'DELETE' },
      () => {
        const revisions = getLocalData('revisions').filter(r => r.id !== id);
        saveLocalData('revisions', revisions);
        return { success: true };
      }
    );
  },
};

// Auth API
export const authApi = {
  // Login
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return handleResponse(response);
    } catch (error) {
      // Demo mode login
      const userData = { name: credentials.email.split('@')[0], email: credentials.email };
      return { token: 'demo-token', user: userData };
    }
  },

  // Signup
  signup: async (userData) => {
    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return handleResponse(response);
    } catch (error) {
      // Demo mode signup
      return { token: 'demo-token', user: { name: userData.name, email: userData.email } };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        localStorage.removeItem('authToken');
        return null;
      }
      
      return handleResponse(response);
    } catch {
      // In demo mode, return stored user
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
};

// Export utility to check if in demo mode
export const isInDemoMode = () => isDemoMode;

export default {
  auth: authApi,
  subjects: subjectsApi,
  progress: progressApi,
  topics: topicsApi,
  sessions: sessionsApi,
  revisions: revisionsApi,
  isInDemoMode,
};
