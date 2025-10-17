import React, { useEffect, useState } from 'react';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    document.body.classList.toggle('dark', isDark);
    document.body.classList.toggle('light', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    setIsDark(saved === 'dark');
  }, []);

  return (
    <div className="theme-toggle">
      <input
        type="checkbox"
        id="theme-switch"
        checked={isDark}
        onChange={() => setIsDark(!isDark)}
      />
      <label htmlFor="theme-switch" className="theme-label">
        <i className="bx bx-sun sun-icon"></i>
        <i className="bx bx-moon moon-icon"></i>
        <div className="ball"></div>
      </label>
    </div>
  );
};

export default ThemeToggle;