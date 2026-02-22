import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Clipboard, Calendar, Link, X, Clock, CheckCircle2, Circle } from 'lucide-react';
import api from '../api';
import TaskDetailModal from './TaskDetailModal';
import SessionDetailModal from './SessionDetailModal';
import './SearchPage.css';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'task', label: 'Tasks' },
  { key: 'session', label: 'Sessions' },
  { key: 'file', label: 'Files' },
];

const TYPE_ICONS = {
  task: Clipboard,
  session: Calendar,
  file: Link,
};

const ACTIVITY_EMOJIS = {
  STUDY: '📚', WATCH: '📺', READ: '📖', PRACTICE: '💻', NOTES: '📝', LISTEN: '🎧'
};

function formatMinutes(mins) {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function ResultCard({ result, onSelect }) {
  const Icon = TYPE_ICONS[result.type] || Clipboard;

  const isNote = result.att_type === 'note';
  const fileUrl = isNote ? null : result.description;

  const handleClick = () => {
    if (result.type === 'file') {
      if (fileUrl) window.open(fileUrl, '_blank', 'noopener,noreferrer');
      else onSelect(result); // note-type: no URL to open, fall through to parent
    } else {
      onSelect(result);
    }
  };

  return (
    <div
      className={`search-result-card search-result-${result.type}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
    >
      <div className="result-icon-wrap">
        <Icon size={16} />
      </div>
      <div className="result-body">
        <div className="result-name">{result.name || '(Untitled)'}</div>
        {result.description && result.type !== 'file' && (
          <div className="result-desc">{result.description}</div>
        )}
        {result.type === 'file' && !isNote && fileUrl && (
          <div className="result-url">{fileUrl}</div>
        )}
        {result.type === 'file' && isNote && result.description && (
          <div className="result-desc">{result.description}</div>
        )}
        <div className="result-meta">
          {result.subject_name && (
            <span className="result-badge result-subject">{result.subject_name}</span>
          )}
          {result.type === 'task' && (
            <span className={`result-badge result-status ${result.completed ? 'done' : 'pending'}`}>
              {result.completed ? <CheckCircle2 size={12} /> : <Circle size={12} />}
              {result.completed ? 'Done' : 'Pending'}
            </span>
          )}
          {result.type === 'task' && result.priority && (
            <span className={`result-badge result-priority priority-${result.priority?.toLowerCase()}`}>
              {result.priority}
            </span>
          )}
          {result.type === 'session' && result.time_spent && (
            <span className="result-badge result-time">
              <Clock size={12} /> {formatMinutes(result.time_spent)}
            </span>
          )}
          {result.type === 'session' && result.session_type && (
            <span className="result-badge result-activity">
              {ACTIVITY_EMOJIS[result.session_type] || ''} {result.session_type}
            </span>
          )}
          {result.type === 'file' && result.file_source && (
            <span className="result-badge result-subject">
              via {result.file_source}
            </span>
          )}
          {result.type === 'file' && isNote && (
            <span className="result-badge result-activity">note</span>
          )}
          <span className="result-date">{formatDate(result.created_at)}</span>
        </div>
      </div>
      <div className={`result-type-label type-${result.type}`}>
        {result.type}
      </div>
    </div>
  );
}

const SearchPage = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q, type) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const calls = [];

      // Tasks and sessions via dedicated search route
      if (type === 'all' || type === 'task' || type === 'session') {
        const backendType = type === 'file' ? 'all' : type === 'all' ? 'task_session' : type;
        calls.push(
          api.search.search(q.trim(), backendType).then(d => d.results || []).catch(() => [])
        );
      } else {
        calls.push(Promise.resolve([]));
      }

      // Files via the comprehensive attachments endpoint (covers all 6 sources)
      if (type === 'all' || type === 'file') {
        calls.push(
          api.attachments.getAll({ search: q.trim() }, 1, 30)
            .then(d => (d.data || []).map(att => ({
              id: att.id,
              type: 'file',
              name: att.title || att.url || '(Untitled)',
              description: att.type === 'note' ? att.note_data?.title : att.url,
              created_at: att.created_at,
              subject_name: att.subject_name,
              file_source: att.source,
              att_type: att.type, // 'url' or 'note'
            })))
            .catch(() => [])
        );
      } else {
        calls.push(Promise.resolve([]));
      }

      const [backendResults, fileResults] = await Promise.all(calls);

      // Merge and sort by created_at
      const merged = [...backendResults, ...fileResults];
      merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setResults(merged);
      setSearched(true);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      doSearch(query, typeFilter);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, typeFilter, doSearch]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  // Shape raw search result into the object the modal expects
  const handleSelect = (result) => {
    if (result.type === 'task') {
      setSelectedTask({
        ...result,
        title: result.title || result.name,
        type: result.task_type,       // modal uses task.type for task kind
        status: result.completed ? 'DONE' : 'TODO',
      });
    } else if (result.type === 'session') {
      setSelectedSession({
        ...result,
        activity: result.activity || result.name,
        type: result.session_type,    // modal uses session.type for STUDY/WATCH etc.
        date: result.date || result.created_at,
      });
    }
  };

  const taskCount = results.filter(r => r.type === 'task').length;
  const sessionCount = results.filter(r => r.type === 'session').length;
  const fileCount = results.filter(r => r.type === 'file').length;

  return (
    <div className="search-page">
      <div className="search-header">
        <div className="search-bar-wrap">
          <Search className="search-icon" size={20} />
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="Search tasks, sessions, files..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button className="search-clear" onClick={clearSearch} aria-label="Clear">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="search-type-filters">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.key}
              className={`type-filter-btn ${typeFilter === f.key ? 'active' : ''}`}
              onClick={() => setTypeFilter(f.key)}
            >
              {f.label}
              {f.key !== 'all' && searched && query && (
                <span className="filter-count">
                  {f.key === 'task' ? taskCount : f.key === 'session' ? sessionCount : fileCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="search-results">
        {loading && (
          <div className="search-state">
            <div className="search-spinner" />
            <span>Searching...</span>
          </div>
        )}

        {!loading && !searched && (
          <div className="search-state search-empty-state">
            <Search size={48} strokeWidth={1} />
            <p>Search across all your tasks, sessions, and files</p>
            <div className="search-hint-pills">
              <span className="hint-pill"><Clipboard size={12} /> Tasks</span>
              <span className="hint-pill"><Calendar size={12} /> Sessions</span>
              <span className="hint-pill"><Link size={12} /> Files</span>
            </div>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="search-state">
            <Search size={36} strokeWidth={1} />
            <p>No results for &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="search-results-count">
              {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </div>
            <div className="search-results-list">
              {results.map((r, i) => (
                <ResultCard key={`${r.type}-${r.id}-${i}`} result={r} onSelect={handleSelect} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onComplete={async (taskId, completed) => {
            try {
              const updated = await api.tasks.update(taskId, { completed });
              setSelectedTask(updated);
              setResults(prev => prev.map(r =>
                r.type === 'task' && r.id === taskId ? { ...r, completed } : r
              ));
            } catch (e) { console.error(e); }
          }}
          onUpdate={async (taskId, updates) => {
            if (taskId === undefined) return;
            try {
              const updated = await api.tasks.update(taskId, updates);
              setSelectedTask(updated);
              return updated;
            } catch (e) { console.error(e); }
          }}
          onDelete={async (taskId) => {
            try {
              await api.tasks.delete(taskId);
              setSelectedTask(null);
              setResults(prev => prev.filter(r => !(r.type === 'task' && r.id === taskId)));
            } catch (e) { console.error(e); }
          }}
          onLogStudy={() => {}}
          onTaskClick={handleSelect}
          onEdit={() => {}}
        />
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onDelete={async (sessionId) => {
            try {
              await api.sessions.delete(sessionId);
              setSelectedSession(null);
              setResults(prev => prev.filter(r => !(r.type === 'session' && r.id === sessionId)));
            } catch (e) { console.error(e); }
          }}
          onEdit={() => setSelectedSession(null)}
          onRevise={() => {}}
        />
      )}
    </div>
  );
};

export default SearchPage;
