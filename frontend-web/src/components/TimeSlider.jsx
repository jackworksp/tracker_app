import React from 'react';
import { Minus, Plus } from 'lucide-react';
import './TimeSlider.css';

export default function TimeSlider({ value, onChange, min = 0, max = 12, step = 0.5 }) {
  const handleIncrement = () => {
    const newValue = Math.min(max, (parseFloat(value) || 0) + step);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, (parseFloat(value) || 0) - step);
    onChange(newValue);
  };

  const handleSliderChange = (e) => {
    onChange(parseFloat(e.target.value));
  };

  const currentValue = parseFloat(value) || 0;
  const fillPercentage = (currentValue / max) * 100;

  return (
    <div className="time-slider-container">
      <div className="time-slider-header">
        <span className="time-slider-label">Time Spent</span>
        <div className="time-slider-value-wrapper">
          <span className="time-slider-value">
            {currentValue.toFixed(1)} <span className="time-slider-unit">hrs</span>
          </span>
        </div>
      </div>

      <div className="time-slider-visual">
        {/* Background tick marks */}
        <div className="time-slider-ticks">
          {Array.from({ length: 13 }).map((_, index) => (
            <div
              key={index}
              className={`time-tick ${index % 2 === 0 ? 'major' : 'minor'}`}
            />
          ))}
        </div>

        {/* Gradient fill */}
        <div
          className="time-slider-fill"
          style={{ width: `${fillPercentage}%` }}
        >
          <div className="time-slider-fill-shine" />
          <div className="time-slider-cursor" />
        </div>
      </div>

      <input
        type="range"
        className="time-slider-input"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleSliderChange}
      />

      <div className="time-slider-controls">
        <button
          type="button"
          className="time-control-btn"
          onClick={handleDecrement}
          disabled={currentValue <= min}
          aria-label="Decrease time"
        >
          <Minus size={16} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className="time-control-btn"
          onClick={handleIncrement}
          disabled={currentValue >= max}
          aria-label="Increase time"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
