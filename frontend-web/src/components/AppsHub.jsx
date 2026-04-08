import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import './AppsHub.css';

const DEFAULT_APPS = [
  { id: 1, name: 'Gemini',        url: 'https://gemini.google.com',       domain: 'gemini.google.com',       desc: 'Google AI assistant' },
  { id: 2, name: 'NotebookLM',    url: 'https://notebooklm.google.com',   domain: 'notebooklm.google.com',   desc: 'AI research notebook' },
  { id: 3, name: 'Typing.com',    url: 'https://www.typing.com',          domain: 'typing.com',              desc: 'Typing practice & lessons' },
  { id: 4, name: 'ChatGPT',       url: 'https://chatgpt.com',             domain: 'chatgpt.com',             desc: 'OpenAI chat assistant' },
  { id: 5, name: 'Claude',        url: 'https://claude.ai',               domain: 'claude.ai',               desc: 'Anthropic AI assistant' },
  { id: 6, name: 'Perplexity',    url: 'https://www.perplexity.ai',       domain: 'perplexity.ai',           desc: 'AI-powered search' },
  { id: 7, name: 'Excalidraw',    url: 'https://excalidraw.com',          domain: 'excalidraw.com',          desc: 'Virtual whiteboard' },
  { id: 8, name: 'Anki',          url: 'https://apps.ankiweb.net',        domain: 'ankiweb.net',             desc: 'Spaced repetition flashcards' },
  { id: 9, name: 'Khan Academy',  url: 'https://www.khanacademy.org',     domain: 'khanacademy.org',         desc: 'Free online courses' },
  { id: 10, name: 'Quizlet',      url: 'https://quizlet.com',             domain: 'quizlet.com',             desc: 'Flashcards & study sets' },
  { id: 11, name: 'Wolfram Alpha',url: 'https://www.wolframalpha.com',    domain: 'wolframalpha.com',        desc: 'Computational knowledge engine' },
  { id: 12, name: 'Notion',       url: 'https://www.notion.so',           domain: 'notion.so',               desc: 'Notes & project management' },
];

const STORAGE_KEY = 'vela_apps';

function loadApps() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_) { /* ignore */ }
  return DEFAULT_APPS;
}

function saveApps(apps) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (_) {
    return '';
  }
}

function logoUrl(domain) {
  return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
}

const EMPTY_FORM = { name: '', url: '', desc: '' };

export default function AppsHub() {
  const [apps, setApps] = useState(loadApps);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  function updateApps(next) {
    setApps(next);
    saveApps(next);
  }

  function removeApp(id) {
    updateApps(apps.filter((a) => a.id !== id));
  }

  function handleFormChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  function handleAdd(e) {
    e.preventDefault();
    const name = form.name.trim();
    const url = form.url.trim();
    if (!name) { setError('App name is required.'); return; }
    if (!url) { setError('URL is required.'); return; }

    let fullUrl = url;
    if (!/^https?:\/\//i.test(fullUrl)) fullUrl = 'https://' + fullUrl;

    const domain = domainFromUrl(fullUrl);
    if (!domain) { setError('Enter a valid URL.'); return; }

    const newApp = {
      id: Date.now(),
      name,
      url: fullUrl,
      domain,
      desc: form.desc.trim() || domain,
    };
    updateApps([...apps, newApp]);
    setForm(EMPTY_FORM);
    setShowForm(false);
    setError('');
  }

  function handleCancel() {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setError('');
  }

  return (
    <div className="apps-hub">
      <div className="apps-hub__header">
        <div className="apps-hub__header-row">
          <div>
            <h2 className="apps-hub__title">Apps</h2>
            <p className="apps-hub__subtitle">Quick access to your study tools</p>
          </div>
          {!showForm && (
            <button className="apps-hub__add-btn" onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Add App
            </button>
          )}
        </div>

        {showForm && (
          <form className="apps-hub__form" onSubmit={handleAdd}>
            <div className="apps-hub__form-fields">
              <input
                className="apps-hub__input"
                name="name"
                placeholder="App name"
                value={form.name}
                onChange={handleFormChange}
                autoFocus
              />
              <input
                className="apps-hub__input"
                name="url"
                placeholder="URL (e.g. https://example.com)"
                value={form.url}
                onChange={handleFormChange}
              />
              <input
                className="apps-hub__input"
                name="desc"
                placeholder="Description (optional)"
                value={form.desc}
                onChange={handleFormChange}
              />
            </div>
            {error && <p className="apps-hub__error">{error}</p>}
            <div className="apps-hub__form-actions">
              <button type="submit" className="apps-hub__submit-btn">Add</button>
              <button type="button" className="apps-hub__cancel-btn" onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        )}
      </div>

      <div className="apps-hub__grid">
        {apps.map((app) => (
          <div key={app.id} className="apps-hub__card-wrap">
            <button
              className="apps-hub__card"
              onClick={() => window.open(app.url, '_blank', 'noopener,noreferrer')}
            >
              <div className="apps-hub__logo-wrap">
                <img
                  src={logoUrl(app.domain)}
                  alt={app.name}
                  className="apps-hub__logo"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <span className="apps-hub__name">{app.name}</span>
              <span className="apps-hub__desc">{app.desc}</span>
            </button>
            <button
              className="apps-hub__remove-btn"
              title="Remove app"
              onClick={() => removeApp(app.id)}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
