import React from 'react';
import './VelaLogo.css';

const VelaLogo = ({ size = 96, className = '', plain = false }) => {
  const iconSrc = `${import.meta.env.BASE_URL}vela-icon.svg`;

  if (plain) {
    return (
      <img
        src={iconSrc}
        alt="Vela"
        draggable={false}
        style={{ width: size, height: size, display: 'block', flexShrink: 0 }}
        className={className}
      />
    );
  }

  return (
    <div
      className={`vela-logo ${className}`}
      style={{ '--vela-logo-size': `${size}px` }}
      role="img"
      aria-label="Vela"
    >
      <div className="vela-logo__glow" aria-hidden="true" />
      <div className="vela-logo__card">
        <div className="vela-logo__shimmer" aria-hidden="true" />
        <img
          className="vela-logo__icon"
          src={iconSrc}
          alt=""
          draggable={false}
        />
      </div>
    </div>
  );
};

export default VelaLogo;
