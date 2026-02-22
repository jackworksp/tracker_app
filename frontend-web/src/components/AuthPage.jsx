import React, { useState } from 'react';
import { Card } from 'antd';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import VelaLogo from './VelaLogo';
import './AuthPage.css'; // We'll create this for specific stylings if needed

export default function AuthPage({ onLogin, onSignup }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'

  return (
    <div className="auth-page-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--background-default)',
        padding: '1rem'
    }}>
      <Card 
        className="auth-card glass-card"
        style={{
            width: '100%',
            maxWidth: '500px',
            border: '1px solid var(--glass-border)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
        }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <VelaLogo size={64} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {mode === 'login' ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {mode === 'login' ? 'Please log in to continue' : 'Join Vela today'}
          </p>
        </div>

        {mode === 'login' ? (
          <LoginForm 
            onLogin={onLogin} 
            onSwitchToSignup={() => setMode('signup')} 
          />
        ) : (
          <SignupForm 
            onSignup={onSignup}
            onSwitchToLogin={() => setMode('login')}
          />
        )}
      </Card>
    </div>
  );
}
