// API Base URL - uses environment variable if set, otherwise:
// - For mobile app (Capacitor): MUST be set via VITE_API_URL during build
// - For web: use relative path (same server as the webpage)
const isCapacitor = window.Capacitor?.isNativePlatform?.() || false;

// CRITICAL: For production mobile builds, VITE_API_URL MUST be set during build
// The hardcoded local IP has been removed to prevent connection issues in production

let API_BASE = import.meta.env.VITE_API_URL ||
  (isCapacitor ? '' : '/vela/api');

// Intelligent fix for common configuration error:
// If VITE_API_URL is just the root (e.g. http://192.168.1.5:3000), append /vela/api
if (API_BASE && /^https?:\/\/[^\/]+:?\d*[\/]?$/.test(API_BASE)) {
    console.warn('⚠️ Detected root URL in VITE_API_URL. Appending /vela/api automatically.');
    API_BASE = API_BASE.replace(/\/$/, '') + '/vela/api';
}

// FORCE RELATIVE PATH in Development Web Mode
// This ensures requests go through the Vite proxy, avoiding CORS and network issues
if (import.meta.env.DEV && !isCapacitor) {
    console.log('🔧 Development Mode: Forcing relative API path to use proxy');
    API_BASE = '/vela/api';
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
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
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

  // Get sessions with filters (goal_id, start_date, end_date, source)
  getSessions: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return safeFetch(`${API_BASE}/progress/all?${queryParams}`);
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

  // Get later queue (WATCH/READ tasks)
  getLater: async (filters = {}) => {
    const queryParams = new URLSearchParams({ types: 'WATCH,READ', ...filters }).toString();
    return safeFetch(`${API_BASE}/tasks?${queryParams}`);
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

  // Get relational subtasks
  getSubtasks: async (taskId) => {
    return safeFetch(`${API_BASE}/tasks/${taskId}/subtasks`);
  },

  // Convert task to subtask
  convertToSubtask: async (taskId, parentTaskId) => {
    return safeFetch(
      `${API_BASE}/tasks/${taskId}/convert-to-subtask`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_task_id: parentTaskId }),
      }
    );
  },

  // Remove subtask relationship
  removeFromSubtask: async (taskId) => {
    return safeFetch(
      `${API_BASE}/tasks/${taskId}/remove-from-subtask`,
      { method: 'PUT' }
    );
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

// Journal API
export const journalApi = {
  // Get all journal entries for a goal
  getByGoal: async (goalId) => {
    return safeFetch(`${API_BASE}/journal/goal/${goalId}`);
  },

  // Get a single journal entry
  getById: async (id) => {
    return safeFetch(`${API_BASE}/journal/${id}`);
  },

  // Create journal entry
  create: async (data) => {
    return safeFetch(
      `${API_BASE}/journal`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
  },

  // Update journal entry
  update: async (id, data) => {
    return safeFetch(
      `${API_BASE}/journal/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
  },

  // Delete journal entry
  delete: async (id) => {
    return safeFetch(
      `${API_BASE}/journal/${id}`,
      { method: 'DELETE' }
    );
  },

  // Get stats for a journal entry
  getStats: async (id) => {
    return safeFetch(`${API_BASE}/journal/${id}/stats`);
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

  // MCP API Key management
  getMcpKey: () => safeFetch(`${API_BASE}/auth/mcp-key`),
  regenerateMcpKey: () => safeFetch(`${API_BASE}/auth/mcp-key/regenerate`, { method: 'POST' }),

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
  getAll: async (folderId, subjectId) => {
    const params = new URLSearchParams();
    if (folderId !== undefined) params.append('folder_id', folderId);
    if (subjectId) params.append('subject_id', subjectId);
    
    return safeFetch(`${API_BASE}/notes?${params.toString()}`);
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
  },
  move: async (id, folderId) => {
    return safeFetch(`${API_BASE}/notes/${id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: folderId })
    });
  },
  copy: async (id, folderId) => {
    return safeFetch(`${API_BASE}/notes/${id}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: folderId })
    });
  }
};

// Note Folders API
export const noteFoldersApi = {
  getAll: async () => {
    return safeFetch(`${API_BASE}/note-folders`);
  },
  get: async (id) => {
    return safeFetch(`${API_BASE}/note-folders/${id}`);
  },
  create: async (data) => {
    return safeFetch(`${API_BASE}/note-folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
  },
  update: async (id, data) => {
    return safeFetch(`${API_BASE}/note-folders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
  },
  delete: async (id) => {
    return safeFetch(`${API_BASE}/note-folders/${id}`, { method: 'DELETE' });
  }
};

// Attachment Folders API
export const attachmentFoldersApi = {
  getAll: async () => {
    return safeFetch(`${API_BASE}/attachment-folders`);
  },
  get: async (id) => {
    return safeFetch(`${API_BASE}/attachment-folders/${id}`);
  },
  create: async (data) => {
    return safeFetch(`${API_BASE}/attachment-folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
  },
  update: async (id, data) => {
    return safeFetch(`${API_BASE}/attachment-folders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
  },
  delete: async (id) => {
    return safeFetch(`${API_BASE}/attachment-folders/${id}`, { method: 'DELETE' });
  }
};

// Note Links API
export const noteLinksApi = {
  // Get all notes linked to a task
  getTaskNotes: async (taskId) => {
    return safeFetch(`${API_BASE}/note-links/task/${taskId}`);
  },
  // Link note to task
  linkToTask: async (taskId, noteId) => {
    return safeFetch(`${API_BASE}/note-links/task/${taskId}/note/${noteId}`, {
        method: 'POST'
    });
  },
  // Unlink note from task
  unlinkFromTask: async (taskId, noteId) => {
    return safeFetch(`${API_BASE}/note-links/task/${taskId}/note/${noteId}`, {
        method: 'DELETE'
    });
  },
  // Get all notes linked to a session
  getSessionNotes: async (sessionId) => {
    return safeFetch(`${API_BASE}/note-links/session/${sessionId}`);
  },
  // Link note to session
  linkToSession: async (sessionId, noteId) => {
    return safeFetch(`${API_BASE}/note-links/session/${sessionId}/note/${noteId}`, {
        method: 'POST'
    });
  },
  // Unlink note from session
  unlinkFromSession: async (sessionId, noteId) => {
    return safeFetch(`${API_BASE}/note-links/session/${sessionId}/note/${noteId}`, {
        method: 'DELETE'
    });
  },
  // Get all tasks and sessions linked to a note
  getNoteLinks: async (noteId) => {
    return safeFetch(`${API_BASE}/note-links/note/${noteId}`);
  }
};

export const attachmentsApi = {
  getAll: async (filters = {}, page = 1, limit = 50) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (filters.subject_id) {
      params.append('subject_id', filters.subject_id.toString());
    }
    if (filters.type) {
      params.append('type', filters.type);
    }
    if (filters.source) {
      params.append('source', filters.source);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.folder_id !== undefined) {
      params.append('folder_id', filters.folder_id === null ? '' : filters.folder_id.toString());
    }

    return safeFetch(`${API_BASE}/attachments?${params.toString()}`);
  },

  create: async (attachmentData) => {
    return safeFetch(`${API_BASE}/attachments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attachmentData)
    });
  },

  delete: async (attachmentId) => {
    // Parse attachment ID to determine the appropriate delete action
    // Format: "attachment-123" (standalone), "task-123", "task-url-123", "session-456", "note-task-789", "note-session-012"
    const idParts = attachmentId.split('-');

    if (idParts[0] === 'attachment') {
      // Standalone attachment: delete directly
      return safeFetch(`${API_BASE}/attachments/${attachmentId}`, {
        method: 'DELETE'
      });
    } else if (idParts[0] === 'note') {
      // Note attachment: delete the link
      const sourceType = idParts[1]; // 'task' or 'session'
      const linkId = idParts[2];
      return safeFetch(`${API_BASE}/note-links/${sourceType}/${linkId}`, {
        method: 'DELETE'
      });
    } else if (idParts[0] === 'task' && idParts[1] === 'url') {
      // Task content URL: clear the url field
      const taskId = idParts[2];
      return safeFetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: null })
      });
    } else if (idParts[0] === 'task') {
      // Task attachment URL: clear the attachment_url field
      const taskId = idParts[1];
      return safeFetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachment_url: null })
      });
    } else if (idParts[0] === 'session') {
      // Session URL: clear the url field
      const sessionId = idParts[1];
      return safeFetch(`${API_BASE}/progress/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: null })
      });
    }

    throw new Error(`Unknown attachment ID format: ${attachmentId}`);
  },

  move: async (attachmentId, folderId) => {
    return safeFetch(`${API_BASE}/attachments/${attachmentId}/move`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_id: folderId })
    });
  },

  rename: async (attachmentId, title) => {
    return safeFetch(`${API_BASE}/attachments/${attachmentId}/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
  },

  bulkMove: async (attachmentIds, folderId) => {
    return safeFetch(`${API_BASE}/attachments/bulk-move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attachment_ids: attachmentIds, folder_id: folderId })
    });
  }
};

export const supportApi = {
  report: (data) => safeFetch(`${API_BASE}/support/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
};

export const searchApi = {
  search: async (q, type = 'all') => {
    const params = new URLSearchParams({ q, type });
    return safeFetch(`${API_BASE}/search?${params.toString()}`);
  }
};

// YouTube search API
export const youtubeApi = {
  // Smart search: sends full prompt to Gemini first to extract best query, then searches YouTube
  search: async (prompt) => {
    return safeFetch(`${API_BASE}/youtube/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
  },
};

export const feedsApi = {
  getChannels: async () => {
    return safeFetch(`${API_BASE}/feeds/channels`);
  },

  addChannel: async (url) => {
    return safeFetch(`${API_BASE}/feeds/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
  },

  deleteChannel: async (channelId) => {
    return safeFetch(`${API_BASE}/feeds/channels/${encodeURIComponent(channelId)}`, {
      method: 'DELETE',
    });
  },

  getVideos: async () => {
    return safeFetch(`${API_BASE}/feeds/videos`);
  },
};

export const rssApi = {
  // List user's RSS feeds (includes unread_count per feed)
  getFeeds: async () => {
    return safeFetch(`${API_BASE}/rss/feeds`);
  },

  // Add a feed by URL
  addFeed: async (url) => {
    return safeFetch(`${API_BASE}/rss/feeds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
  },

  // Remove a feed by its DB id
  deleteFeed: async (feedId) => {
    return safeFetch(`${API_BASE}/rss/feeds/${encodeURIComponent(feedId)}`, {
      method: 'DELETE',
    });
  },

  // Get articles (refreshes feeds server-side). Optional feedId filter.
  getArticles: async (feedId = null) => {
    const params = new URLSearchParams();
    if (feedId !== null) params.set('feed_id', feedId);
    return safeFetch(`${API_BASE}/rss/articles?${params.toString()}`);
  },

  // Mark an article read or unread
  markRead: async (articleId, isRead = true) => {
    return safeFetch(`${API_BASE}/rss/articles/${articleId}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_read: isRead }),
    });
  },
};

// Ask (AI chat) API
export const askApi = {
  // Returns a ReadableStream from the SSE response
  chat: async (messages, mode = 'chat') => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, mode }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to connect to AI');
    }
    return response.body;
  },

  // Embed all of the user's existing data for RAG
  syncEmbeddings: () => safeFetch(`${API_BASE}/embeddings/sync`, { method: 'POST' }),
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
  journal: journalApi,
  notes: notesApi,
  noteFolders: noteFoldersApi,
  noteLinks: noteLinksApi,
  attachments: attachmentsApi,
  search: searchApi,
  ask: askApi,
  youtube: youtubeApi,
  feeds: feedsApi,
  rss: rssApi,
  support: supportApi,
};
