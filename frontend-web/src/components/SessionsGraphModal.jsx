import React, { useState, useMemo } from 'react';
import { X, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './SessionsGraphModal.css';

// ─── Data helpers ────────────────────────────────────────────────────────────

function toDateKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekKey(dateStr) {
  const d = new Date(dateStr);
  // Monday of the week
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return toDateKey(d.toISOString());
}

function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildDailyBuckets(sessions, days = 30) {
  const map = {};
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d.toISOString());
    map[key] = { key, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), minutes: 0, count: 0 };
  }
  sessions.forEach(s => {
    const key = toDateKey(s.date);
    if (map[key]) {
      map[key].minutes += s.time_spent || 0;
      map[key].count += 1;
    }
  });
  return Object.values(map);
}

function buildWeeklyBuckets(sessions, weeks = 12) {
  const map = {};
  const today = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 7);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    const key = toDateKey(d.toISOString());
    map[key] = { key, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), minutes: 0, count: 0 };
  }
  sessions.forEach(s => {
    const key = getWeekKey(s.date);
    if (map[key]) {
      map[key].minutes += s.time_spent || 0;
      map[key].count += 1;
    }
  });
  return Object.values(map);
}

function buildMonthlyBuckets(sessions, months = 12) {
  const map = {};
  const today = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = getMonthKey(d.toISOString());
    map[key] = { key, label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), minutes: 0, count: 0 };
  }
  sessions.forEach(s => {
    const key = getMonthKey(s.date);
    if (map[key]) {
      map[key].minutes += s.time_spent || 0;
      map[key].count += 1;
    }
  });
  return Object.values(map);
}

function fmtTime(minutes) {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────

const CHART_H = 180;
const BAR_RADIUS = 4;

function BarChart({ buckets, accentColor }) {
  const [hovered, setHovered] = useState(null);
  const maxMin = Math.max(...buckets.map(b => b.minutes), 1);

  const svgRef = React.useRef();
  const [svgWidth, setSvgWidth] = React.useState(600);

  React.useEffect(() => {
    const obs = new ResizeObserver(entries => {
      setSvgWidth(entries[0].contentRect.width || 600);
    });
    if (svgRef.current) obs.observe(svgRef.current);
    return () => obs.disconnect();
  }, []);

  const n = buckets.length;
  const gap = Math.max(2, Math.floor(svgWidth / n / 5));
  const barW = Math.max(4, Math.floor((svgWidth - gap * (n + 1)) / n));

  // Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: CHART_H - f * CHART_H,
    label: fmtTime(Math.round(f * maxMin))
  }));

  return (
    <div ref={svgRef} style={{ width: '100%', position: 'relative' }}>
      <svg width="100%" height={CHART_H + 40} style={{ overflow: 'visible', display: 'block' }}>
        {/* Y gridlines */}
        {yLabels.map((yl, i) => (
          <g key={i}>
            <line
              x1={0} y1={yl.y} x2={svgWidth} y2={yl.y}
              stroke="rgba(255,255,255,0.07)" strokeWidth={1}
              className="chart-gridline"
            />
            <text
              x={svgWidth + 4} y={yl.y + 4}
              fontSize={9} fill="rgba(255,255,255,0.35)"
              className="chart-axis-label"
              textAnchor="start"
            >
              {yl.label}
            </text>
          </g>
        ))}

        {/* Bars */}
        {buckets.map((b, i) => {
          const barH = Math.max(b.minutes > 0 ? 4 : 0, (b.minutes / maxMin) * CHART_H);
          const x = gap + i * (barW + gap);
          const y = CHART_H - barH;
          const isHov = hovered === i;
          const alpha = b.minutes > 0 ? (isHov ? 1 : 0.75) : 0.12;

          return (
            <g key={b.key}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={x} y={y} width={barW} height={barH}
                rx={BAR_RADIUS} ry={BAR_RADIUS}
                fill={accentColor}
                opacity={alpha}
                style={{ transition: 'opacity 0.15s' }}
              />
              {/* X label (every Nth) */}
              {(i % Math.ceil(n / 8) === 0) && (
                <text
                  x={x + barW / 2} y={CHART_H + 14}
                  fontSize={9} fill="rgba(255,255,255,0.4)"
                  className="chart-axis-label"
                  textAnchor="middle"
                >
                  {b.label}
                </text>
              )}

              {/* Tooltip */}
              {isHov && (
                <g>
                  <rect
                    x={Math.min(x - 4, svgWidth - 80)} y={y - 36}
                    width={76} height={28}
                    rx={6} ry={6}
                    fill="#1a1f2e"
                    stroke={accentColor}
                    strokeWidth={0.8}
                    opacity={0.95}
                  />
                  <text
                    x={Math.min(x - 4, svgWidth - 80) + 38} y={y - 23}
                    fontSize={10} fill="white"
                    textAnchor="middle" fontWeight="600"
                  >
                    {fmtTime(b.minutes)}
                  </text>
                  <text
                    x={Math.min(x - 4, svgWidth - 80) + 38} y={y - 12}
                    fontSize={9} fill="rgba(255,255,255,0.55)"
                    textAnchor="middle"
                  >
                    {b.label} · {b.count} session{b.count !== 1 ? 's' : ''}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Baseline */}
        <line x1={0} y1={CHART_H} x2={svgWidth} y2={CHART_H}
          stroke="rgba(255,255,255,0.12)" strokeWidth={1}
          className="chart-gridline"
        />
      </svg>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'daily',   label: 'Daily',   days: 30  },
  { id: 'weekly',  label: 'Weekly',  weeks: 12 },
  { id: 'monthly', label: 'Monthly', months: 12 },
];

const ACCENT = '#06D6A0';

export default function SessionsGraphModal({ sessions = [], onClose }) {
  const [tab, setTab] = useState('daily');

  const buckets = useMemo(() => {
    if (tab === 'daily')   return buildDailyBuckets(sessions, 30);
    if (tab === 'weekly')  return buildWeeklyBuckets(sessions, 12);
    return buildMonthlyBuckets(sessions, 12);
  }, [tab, sessions]);

  const totalMinutes = sessions.reduce((a, s) => a + (s.time_spent || 0), 0);
  const activeDays = new Set(sessions.map(s => toDateKey(s.date))).size;
  const avgPerSession = sessions.length ? Math.round(totalMinutes / sessions.length) : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.65)',
          zIndex: 1400,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="sessions-graph-modal"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sgm-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BarChart2 size={20} style={{ color: ACCENT }} />
              <span className="sgm-title">Study Progress</span>
            </div>
            <button className="sgm-close" onClick={onClose}><X size={18} /></button>
          </div>

          {/* Stats row */}
          <div className="sgm-stats">
            <div className="sgm-stat">
              <span className="sgm-stat-value">{fmtTime(totalMinutes)}</span>
              <span className="sgm-stat-label">Total time</span>
            </div>
            <div className="sgm-stat">
              <span className="sgm-stat-value">{sessions.length}</span>
              <span className="sgm-stat-label">Sessions</span>
            </div>
            <div className="sgm-stat">
              <span className="sgm-stat-value">{activeDays}</span>
              <span className="sgm-stat-label">Active days</span>
            </div>
            <div className="sgm-stat">
              <span className="sgm-stat-value">{fmtTime(avgPerSession)}</span>
              <span className="sgm-stat-label">Avg / session</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="sgm-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`sgm-tab ${tab === t.id ? 'sgm-tab--active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="sgm-chart">
            <BarChart buckets={buckets} accentColor={ACCENT} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
