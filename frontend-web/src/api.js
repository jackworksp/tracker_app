// API Base URL - uses environment variable if set, otherwise:
// - For mobile app (Capacitor): MUST be set via VITE_API_URL during build
// - For web: use relative path (same server as the webpage)
const isCapacitor = window.Capacitor !== undefined;

// CRITICAL: For production mobile builds, VITE_API_URL MUST be set during build
// The hardcoded local IP has been removed to prevent connection issues in production

let API_BASE = import.meta.env.VITE_API_URL ||
  (isCapacitor ? '' : '/trackapp/api');

// Intelligent fix for common configuration error:
// If VITE_API_URL is just the root (e.g. http://192.168.1.5:3000), append /trackapp/api
if (API_BASE && /^https?:\/\/[^\/]+:?\d*[\/]?$/.test(API_BASE)) {
    console.warn('⚠️ Detected root URL in VITE_API_URL. Appending /trackapp/api automatically.');
    API_BASE = API_BASE.replace(/\/$/, '') + '/trackapp/api';
}

// Log the configuration
console.log('🔗 API Configuration:', {
    isCapacitor,
    envUrl: import.meta.env.VITE_API_URL,
    finalBase: API_BASE,
    mode: isCapacitor ? 'Mobile (Capacitor)' : 'Web'
});

if (isCapacitor && !API_BASE) {
  console.error('🚨 CRITICAL: VITE_API_URL not set and no fallback! Mobile requests will fail.');
}

// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Safe fetch wrapper (Simplified: No demo mode fallback)
// Safe fetch wrapper (Simplified: No demo mode fallback)
async function safeFetch(url, options = {}) {
  // Inject Authorization header if token exists
  const token = localStorage.getItem('authToken');
  const headers = {
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const finalOptions = {
    ...options,
    headers
  };

  // Default timeout: 15 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  finalOptions.signal = controller.signal;

  try {
    console.log(`🌐 API Request: ${finalOptions.method || 'GET'} ${url}`);
    console.log(`🔍 Full URL: ${url.startsWith('http') ? url : `${window.location.origin}${url}`}`);

    const response = await fetch(url, finalOptions);
    clearTimeout(timeoutId); // Request completed in time

    console.log(`✅ Response: ${response.status} ${response.statusText}`);
    const data = await handleResponse(response);
    
    // Better logging
    try {
        if (Array.isArray(data)) {
            console.log(`📦 Data from ${url}: Array[${data.length}]`, data.slice(0, 3)); 
        } else if (typeof data === 'object') {
             const summary = {};
             for (const key in data) {
                 if (Array.isArray(data[key])) {
                     summary[key] = `Array[${data[key].length}]`;
                 } else {
                     summary[key] = data[key];
                 }
             }
             console.log(`📦 Data from ${url}:`, JSON.stringify(summary));
        } else {
            console.log(`📦 Data from ${url}:`, JSON.stringify(data));
        }
    } catch (e) {
        console.log(`📦 Data from ${url}: (Error logging)`, e);
    }
    
    return data;
  } catch (error) {
    // Log detailed error information
    console.error('❌ Fetch error details:', {
      url,
      message: error.name === 'AbortError' ? 'Request timed out' : error.message,
      name: error.name,
      stack: error.stack,
      type: error.constructor.name
    });
    
    if (error.name === 'AbortError') {
        throw new Error('Connection timed out. Please check your internet or server status.');
    }
    
    throw error;
  }
}

// Subjects API
export const subjectsApi = {
  // Get all subjects
  getAll: async () => {
    return safeFetch(`${API_BASE}/subjects`);
  },

  // Get single subject with all data
  getById: async (id) => {
    return safeFetch(`${API_BASE}/subjects/${id}`);
  },

  // Create new subject
  create: async (data) => {
    return safeFetch(
      `${API_BASE}/subjects`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
      }
    );
  },

  // Delete subject
  delete: async (id) => {
    return safeFetch(
      `${API_BASE}/subjects/${id}`,
      { method: 'DELETE' }
    );
  },

  // Seed AWS topics
  seedTopics: async (id) => {
    return safeFetch(
      `${API_BASE}/progress/seed/${id}`,
      { method: 'POST' }
    );
  },
};

// Progress API
export const progressApi = {
  // Get all progress for a subject
  getBySubject: async (subjectId, filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = subjectId ? `${API_BASE}/progress/${subjectId}` : `${API_BASE}/progress/all`;
    return safeFetch(`${endpoint}?${queryParams}`);
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
      }
    );
  },

  // Delete study session
  delete: async (id) => {
    return safeFetch(
      `${API_BASE}/progress/sessions/${id}`,
      { method: 'DELETE' }
    );
  },

  // Increment revision count
  incrementRevision: async (id) => {
    return safeFetch(
      `${API_BASE}/progress/sessions/${id}/revise`,
      { method: 'POST' }
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
      }
    );
  },

  // Mark as revised
  markRevised: async (id) => {
    return safeFetch(
      `${API_BASE}/progress/revisions/${id}`,
      { method: 'PUT' }
    );
  },

  // Delete revision item
  delete: async (id) => {
    return safeFetch(
      `${API_BASE}/progress/revisions/${id}`,
      { method: 'DELETE' }
    );
  },
};

// Tasks API (New Rich Tasks)
export const tasksApi = {
  // Get all tasks
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return safeFetch(`${API_BASE}/tasks?${queryParams}`);
  },

  // Create task
  create: async (data) => {
    return safeFetch(
      `${API_BASE}/tasks`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
  },

  // Get tasks by subject
  getBySubject: async (subjectId, filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return safeFetch(`${API_BASE}/tasks/${subjectId}?${queryParams}`);
  },

  // Update task
  update: async (id, data) => {
    return safeFetch(
      `${API_BASE}/tasks/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
  },

  // Delete task
  delete: async (id) => {
    return safeFetch(
      `${API_BASE}/tasks/${id}`,
      { method: 'DELETE' }
    );
  },

  // Reminder methods
  setReminder: async (id, reminderData) => {
    return safeFetch(
      `${API_BASE}/tasks/${id}/reminder`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderData),
      }
    );
  },

  snoozeReminder: async (id, snooze_minutes) => {
    return safeFetch(
      `${API_BASE}/tasks/${id}/reminder/snooze`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snooze_minutes }),
      }
    );
  },

  dismissReminder: async (id) => {
    return safeFetch(
      `${API_BASE}/tasks/${id}/reminder/dismiss`,
      { method: 'POST' }
    );
  },

  removeReminder: async (id) => {
    return safeFetch(
      `${API_BASE}/tasks/${id}/reminder`,
      { method: 'DELETE' }
    );
  },

  getPendingReminders: async () => {
    return safeFetch(`${API_BASE}/tasks/reminders/pending`);
  },
};

// Goals API
export const goalsApi = {
  // Get all goals for current user
  getAll: async () => {
    return safeFetch(`${API_BASE}/goals`);
  },

  // Create goal
  create: async (data) => {
    return safeFetch(
      `${API_BASE}/goals`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
  },

  // Update goal
  update: async (id, data) => {
    return safeFetch(
      `${API_BASE}/goals/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
  },

  // Delete goal
  delete: async (id) => {
    return safeFetch(
      `${API_BASE}/goals/${id}`,
      { method: 'DELETE' }
    );
  },
};

// Auth API
export const authApi = {
  // Login
  login: async (credentials) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  // Signup
  signup: async (userData) => {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
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
    } catch (error) {
       console.error('Failed to fetch current user:', error);
       return null;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
  },

  // Upload profile photo
  uploadProfilePhoto: async (file) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No auth token found');

    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetch(`${API_BASE}/auth/upload-photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Content-Type is set automatically with boundary for FormData
      },
      body: formData
    });

    return handleResponse(response);
  },
};

// Notes API
export const notesApi = {
  getAll: async () => {
    return safeFetch(`${API_BASE}/notes`);
  },
  create: async (data) => {
    return safeFetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
  },
  update: async (id, data) => {
    return safeFetch(`${API_BASE}/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
  },
  delete: async (id) => {
    return safeFetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
  }
};

export default {
  auth: authApi,
  subjects: subjectsApi,
  progress: progressApi,
  topics: topicsApi,
  sessions: sessionsApi,
  revisions: revisionsApi,
  tasks: tasksApi,
  goals: goalsApi,
  notes: notesApi,
};
