import VelaLogo from './VelaLogo';
import './LandingPage.css';

const features = [
  {
    icon: '📋',
    title: 'Task Management',
    desc: 'Create and prioritize tasks with deadlines, subtasks, and subject tagging. Never lose track of what needs to be done.',
  },
  {
    icon: '⏱️',
    title: 'Study Sessions',
    desc: 'Log every study session with duration, activity type, and notes. Build a detailed timeline of your learning journey.',
  },
  {
    icon: '📝',
    title: 'Note Taking',
    desc: 'Write rich notes organized in folders. Link related concepts together to build a personal knowledge graph.',
  },
  {
    icon: '🎯',
    title: 'Goal Tracking',
    desc: 'Set learning objectives and track progress. Stay motivated with clear milestones toward your goals.',
  },
  {
    icon: '📎',
    title: 'Attachments Hub',
    desc: 'Organize PDFs, links, images, and YouTube videos in one place. Every study material, always findable.',
  },
  {
    icon: '📊',
    title: 'Progress Analytics',
    desc: 'See total study hours, completed tasks, and activity breakdowns. Understand how you spend your learning time.',
  },
];

const activityTypes = [
  { icon: '📚', label: 'Study' },
  { icon: '📺', label: 'Watch' },
  { icon: '📖', label: 'Read' },
  { icon: '💻', label: 'Practice' },
  { icon: '📝', label: 'Notes' },
  { icon: '🎧', label: 'Listen' },
];

export default function LandingPage({ onGetStarted, onSignIn }) {
  return (
    <div className="landing-page">
      {/* Nav */}
      <header className="landing-nav">
        <div className="landing-nav__inner">
          <div className="landing-nav__brand">
            <VelaLogo size={32} plain />
            <span className="landing-nav__name">Vela</span>
          </div>
          <nav className="landing-nav__links">
            <button className="landing-btn landing-btn--ghost" onClick={onSignIn}>
              Sign In
            </button>
            <button className="landing-btn landing-btn--primary" onClick={onGetStarted}>
              Get Started Free
            </button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="landing-hero">
          <div className="landing-hero__inner">
            <div className="landing-hero__badge">Personal Learning Management System</div>
            <h1 className="landing-hero__title">
              Master Your Studies.<br />
              <span className="landing-hero__accent">Achieve Your Goals.</span>
            </h1>
            <p className="landing-hero__desc">
              Vela is an all-in-one study tracker that helps you log sessions, manage tasks,
              organize notes, and monitor goals — across all your subjects in one place.
            </p>
            <div className="landing-hero__cta">
              <button className="landing-btn landing-btn--primary landing-btn--lg" onClick={onGetStarted}>
                Get Started Free
              </button>
              <button className="landing-btn landing-btn--outline landing-btn--lg" onClick={onSignIn}>
                Sign In
              </button>
            </div>

            <div className="landing-activity-types">
              {activityTypes.map((a) => (
                <span key={a.label} className="landing-activity-chip">
                  {a.icon} {a.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="landing-features" aria-labelledby="features-heading">
          <div className="landing-section-inner">
            <h2 id="features-heading" className="landing-section-title">
              Everything you need to study smarter
            </h2>
            <p className="landing-section-subtitle">
              Track time, manage tasks, take notes, and hit your learning goals — all in one app.
            </p>
            <div className="landing-features__grid">
              {features.map((f) => (
                <article key={f.title} className="landing-feature-card">
                  <div className="landing-feature-card__icon" aria-hidden="true">{f.icon}</div>
                  <h3 className="landing-feature-card__title">{f.title}</h3>
                  <p className="landing-feature-card__desc">{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="landing-how" aria-labelledby="how-heading">
          <div className="landing-section-inner">
            <h2 id="how-heading" className="landing-section-title">How it works</h2>
            <p className="landing-section-subtitle">
              From subject creation to goal completion in four simple steps.
            </p>
            <ol className="landing-steps">
              {[
                { step: '01', title: 'Create a Subject', desc: 'Add your courses, certifications, or any topic you want to track.' },
                { step: '02', title: 'Add Tasks & Goals', desc: 'Break down what needs to be done and set the outcomes you want to achieve.' },
                { step: '03', title: 'Log Study Sessions', desc: 'Record every session with time spent, activity type, and any links or notes.' },
                { step: '04', title: 'Review Your Progress', desc: 'See your total hours, completed tasks, and how close you are to your goals.' },
              ].map((s) => (
                <li key={s.step} className="landing-step">
                  <div className="landing-step__num">{s.step}</div>
                  <div>
                    <h3 className="landing-step__title">{s.title}</h3>
                    <p className="landing-step__desc">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="landing-cta-banner" aria-labelledby="cta-heading">
          <div className="landing-section-inner landing-cta-banner__inner">
            <h2 id="cta-heading" className="landing-cta-banner__title">
              Ready to take control of your learning?
            </h2>
            <p className="landing-cta-banner__desc">
              Join learners who use Vela to stay organized, track progress, and achieve their study goals.
            </p>
            <button className="landing-btn landing-btn--primary landing-btn--lg" onClick={onGetStarted}>
              Get Started Free
            </button>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div className="landing-footer__brand">
            <VelaLogo size={24} plain />
            <span>Vela</span>
          </div>
          <p className="landing-footer__tagline">
            A personal learning management system for students and self-learners.
          </p>
          <p className="landing-footer__copy">&copy; {new Date().getFullYear()} Vela. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
