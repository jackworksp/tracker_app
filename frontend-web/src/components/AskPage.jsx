import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, Youtube, X, ExternalLink, Bookmark, BookmarkCheck } from 'lucide-react';
import api from '../api';
import './AskPage.css';

const WELCOME = { role: 'assistant', content: '', isWelcome: true };

const TOOLS = [
  { id: 'youtube', label: 'YouTube', icon: <Youtube size={16} />, color: '#ff0000', placeholder: 'Search YouTube…' },
];

export default function AskPage({ subjectId }) {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showToolMenu, setShowToolMenu] = useState(false);
  const [activeTool, setActiveTool] = useState(null); // null | 'youtube'
  const [player, setPlayer] = useState(null); // { id, title }
  const bottomRef = useRef(null);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const toolMenuRef = useRef(null);

  const isGreetingState = messages.length === 1 && messages[0].isWelcome;

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { if (streaming) scrollToBottom(); }, [messages, streaming]);

  // Close tool menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (toolMenuRef.current && !toolMenuRef.current.contains(e.target)) {
        setShowToolMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleScroll = () => {
    const el = messagesRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');

    if (activeTool === 'youtube') {
      await handleYouTubeSearch(text);
    } else {
      await handleAIChat(text);
    }
  };

  const handleAIChat = async (text) => {
    const userMsg = { role: 'user', content: text };
    const history = messages.filter(m => !m.isWelcome);
    const apiMessages = [...history, userMsg];

    setMessages(prev => [
      ...prev.filter(m => !m.isWelcome),
      userMsg,
      { role: 'assistant', content: '', pending: true },
    ]);
    setStreaming(true);

    try {
      const stream = await api.ask.chat(apiMessages);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = '', fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              fullText += parsed.text;
              setMessages(prev => {
                const u = [...prev];
                u[u.length - 1] = { role: 'assistant', content: fullText, pending: true };
                return u;
              });
            }
          } catch (err) {
            if (err.message !== 'Unexpected end of JSON input') throw err;
          }
        }
      }
      setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: fullText }; return u; });
    } catch (err) {
      setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: `Error: ${err.message}`, error: true }; return u; });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleYouTubeSearch = async (query) => {
    const userMsg = { role: 'user', content: query, toolQuery: query };
    setMessages(prev => [
      ...prev.filter(m => !m.isWelcome),
      userMsg,
      { role: 'assistant', content: '', pending: true },
    ]);
    setStreaming(true);

    try {
      const history = messages.filter(m => !m.isWelcome && !m.toolQuery);
      const stream = await api.ask.chat([...history, { role: 'user', content: query }], 'youtube');
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = '', fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.videos) {
              // YouTube results arrived — attach to message
              setMessages(prev => {
                const u = [...prev];
                u[u.length - 1] = { ...u[u.length - 1], youtubeResults: parsed.videos };
                return u;
              });
            }
            if (parsed.text) {
              // Strip the VELA_VIDEOS line from displayed text
              const clean = parsed.text.replace(/VELA_VIDEOS:[\s\S]*$/, '').trimEnd();
              if (clean) {
                fullText += clean;
                setMessages(prev => {
                  const u = [...prev];
                  u[u.length - 1] = { ...u[u.length - 1], content: fullText, pending: true };
                  return u;
                });
              }
            }
          } catch (err) {
            if (err.message !== 'Unexpected end of JSON input') throw err;
          }
        }
      }

      setMessages(prev => {
        const u = [...prev];
        u[u.length - 1] = { ...u[u.length - 1], content: fullText, pending: false };
        return u;
      });
    } catch (err) {
      setMessages(prev => {
        const u = [...prev];
        u[u.length - 1] = { role: 'assistant', content: `Error: ${err.message}`, error: true };
        return u;
      });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const selectTool = (toolId) => {
    setActiveTool(toolId);
    setShowToolMenu(false);
    inputRef.current?.focus();
  };

  const clearTool = () => { setActiveTool(null); inputRef.current?.focus(); };
  const clearChat = () => { setMessages([WELCOME]); setInput(''); setActiveTool(null); inputRef.current?.focus(); };

  const activeTool_ = TOOLS.find(t => t.id === activeTool);
  const placeholder = activeTool_?.placeholder || 'Ask anything…';
  const canSend = input.trim().length > 0 && !streaming;

  return (
    <div className="ask-page">
      <div className={`ask-messages${isGreetingState ? ' ask-greeting-state' : ''}`} ref={messagesRef} onScroll={handleScroll}>
        {isGreetingState ? (
          <div className="ask-greeting">
            <p className="ask-greeting-text">How can I help you today?</p>
          </div>
        ) : (
          <div className="ask-thread">
            {messages.filter(m => !m.isWelcome).map((msg, i) => (
              <div key={i} className={`ask-turn ask-turn--${msg.role}${msg.error ? ' ask-turn--error' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="ask-turn-label">
                    <span className="ask-label-dot" /><span className="ask-label-text">Vela</span>
                  </div>
                )}
                <div className="ask-turn-body">
                  {msg.role === 'assistant' ? (
                    msg.youtubeLoading && !msg.youtubeResults ? (
                      <span className="ask-yt-loading">Searching YouTube<span className="ask-cursor" /></span>
                    ) : (
                      <>
                        <MessageContent content={msg.content} pending={msg.pending} />
                        {msg.youtubeResults && (
                          <YouTubeResults videos={msg.youtubeResults} query={msg.ytQuery} onPlay={setPlayer} subjectId={subjectId} />
                        )}
                      </>
                    )
                  ) : (
                    <p className="ask-user-text">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {showScrollBtn && (
        <button className="ask-scroll-btn" onClick={scrollToBottom}><ArrowDown size={16} /></button>
      )}

      <div className="ask-composer">
        <div className="ask-composer-card">
          {/* Active tool pill */}
          {activeTool_ && (
            <div className="ask-tool-pill">
              {activeTool_.icon}
              <span>{activeTool_.label}</span>
              <button onClick={clearTool}><X size={12} /></button>
            </div>
          )}

          <textarea
            ref={inputRef}
            className="ask-textarea"
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={streaming}
          />

          <div className="ask-toolbar">
            <div className="ask-toolbar-left" ref={toolMenuRef}>
              <button
                type="button"
                className={`ask-plus-btn${showToolMenu ? ' ask-plus-btn--open' : ''}`}
                onClick={() => setShowToolMenu(v => !v)}
                title="Add tool"
              >
                <Plus size={16} />
              </button>

              {showToolMenu && (
                <div className="ask-tool-menu">
                  {TOOLS.map(tool => (
                    <button
                      key={tool.id}
                      className={`ask-tool-item${activeTool === tool.id ? ' ask-tool-item--active' : ''}`}
                      onClick={() => selectTool(tool.id)}
                    >
                      <span className="ask-tool-item-icon" style={{ color: tool.color }}>{tool.icon}</span>
                      <span>{tool.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <button type="button" className="ask-clear-btn" onClick={clearChat} title="Clear chat">
                <Trash2 size={16} />
              </button>
            </div>

            <button
              type="button"
              className={`ask-send-btn${canSend ? ' ask-send-btn--active' : ''}`}
              onClick={handleSubmit}
              disabled={!canSend}
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>
      {/* YouTube Player Modal */}
      {player && (
        <div className="ask-yt-player-overlay" onClick={() => setPlayer(null)}>
          <div className="ask-yt-player-modal" onClick={e => e.stopPropagation()}>
            <div className="ask-yt-player-header">
              <span className="ask-yt-player-title">{player.title}</span>
              <div className="ask-yt-player-actions">
                <a href={`https://www.youtube.com/watch?v=${player.id}`} target="_blank" rel="noopener noreferrer" title="Open on YouTube">
                  <ExternalLink size={16} />
                </a>
                <button onClick={() => setPlayer(null)} title="Close"><X size={18} /></button>
              </div>
            </div>
            <div className="ask-yt-player-embed">
              <iframe
                src={`https://www.youtube.com/embed/${player.id}?autoplay=1`}
                title={player.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function YouTubeResults({ videos, query, onPlay, subjectId }) {
  const [saved, setSaved] = useState({}); // { [videoId]: 'saving' | 'saved' | 'error' }

  const handleSave = async (e, v) => {
    e.stopPropagation();
    if (saved[v.id] === 'saving' || saved[v.id] === 'saved') return;
    setSaved(s => ({ ...s, [v.id]: 'saving' }));
    try {
      await api.attachments.create({
        subject_id: subjectId || null,
        title: v.title,
        url: `https://www.youtube.com/watch?v=${v.id}`,
      });
      setSaved(s => ({ ...s, [v.id]: 'saved' }));
    } catch {
      setSaved(s => ({ ...s, [v.id]: 'error' }));
    }
  };

  return (
    <div className="ask-yt-results">
      <p className="ask-yt-label">YouTube results for "<strong>{query}</strong>"</p>
      <div className="ask-yt-list">
        {videos.map(v => (
          <div
            key={v.id}
            className="ask-yt-card"
            onClick={() => onPlay({ id: v.id, title: v.title })}
          >
            <div className="ask-yt-thumb">
              <img src={v.thumbnail} alt={v.title} loading="lazy" />
              {v.duration && <span className="ask-yt-duration">{v.duration}</span>}
            </div>
            <div className="ask-yt-info">
              <p className="ask-yt-title">{v.title}</p>
              {v.author && <p className="ask-yt-channel">{v.author}</p>}
            </div>
            <button
              className={`ask-yt-save-btn${saved[v.id] === 'saved' ? ' ask-yt-save-btn--saved' : ''}${saved[v.id] === 'error' ? ' ask-yt-save-btn--error' : ''}`}
              onClick={(e) => handleSave(e, v)}
              title={saved[v.id] === 'saved' ? 'Saved to Files' : 'Save to Files'}
              disabled={saved[v.id] === 'saving'}
            >
              {saved[v.id] === 'saved'
                ? <BookmarkCheck size={15} />
                : <Bookmark size={15} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageContent({ content, pending }) {
  const [expanded, setExpanded] = useState(false);

  const text = content || '';
  if (!text && pending) return <span className="ask-cursor" />;
  if (!text) return null;

  const parts = text.split(/(```[\s\S]*?```)/g);
  const rendered = (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const lines = part.slice(3).split('\n');
          const lang = lines[0].trim();
          const code = lines.slice(1).join('\n').replace(/```$/, '').trimEnd();
          return (
            <pre key={i} className="ask-code-block">
              {lang && <span className="ask-code-lang">{lang}</span>}
              <code>{code}</code>
            </pre>
          );
        }
        const inline = part.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((s, j) => {
          if (s.startsWith('**') && s.endsWith('**')) return <strong key={j}>{s.slice(2, -2)}</strong>;
          if (s.startsWith('`') && s.endsWith('`')) return <code key={j} className="ask-inline-code">{s.slice(1, -1)}</code>;
          return s.split('\n').map((line, k, arr) => (
            <React.Fragment key={`${j}-${k}`}>{line}{k < arr.length - 1 && <br />}</React.Fragment>
          ));
        });
        return <span key={i}>{inline}</span>;
      })}
      {pending && <span className="ask-cursor" />}
    </>
  );

  // While streaming, always show full content
  if (pending) return <div className="ask-msg-body">{rendered}</div>;

  return (
    <div className="ask-msg-collapsed-wrap">
      <button className="ask-msg-toggle" onClick={() => setExpanded(e => !e)}>
        <span className="ask-msg-preview">
          {expanded ? 'Vela\'s response' : (text.slice(0, 80) + (text.length > 80 ? '…' : ''))}
        </span>
        <span className={`ask-yt-chevron${expanded ? ' ask-yt-chevron--open' : ''}`}>▾</span>
      </button>
      {expanded && <div className="ask-msg-body ask-msg-body--expanded">{rendered}</div>}
    </div>
  );
}
