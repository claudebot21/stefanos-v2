'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme, theme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'system': return '🖥️';
      default: return resolvedTheme === 'dark' ? '🌙' : '☀️';
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'Auto';
      default: return resolvedTheme === 'dark' ? 'Dark' : 'Light';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      style={styles.button}
      title={`Theme: ${getThemeLabel()} (Cmd/Ctrl+Shift+L)`}
      aria-label={`Current theme: ${getThemeLabel()}. Click to toggle.`}
    >
      <span style={styles.icon}>{getThemeIcon()}</span>
      <span style={styles.label}>{getThemeLabel()}</span>
    </button>
  );
}

export function ThemeSelector() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themes: Array<{ value: typeof theme; label: string; icon: string }> = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'Auto', icon: '🖥️' },
  ];

  return (
    <div style={styles.selector}>
      {themes.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          style={{
            ...styles.option,
            ...(theme === value ? styles.optionActive : {}),
          }}
          title={`Switch to ${label} mode`}
        >
          <span style={styles.optionIcon}>{icon}</span>
          <span style={styles.optionLabel}>{label}</span>
          {theme === value && <span style={styles.check}>✓</span>}
        </button>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'var(--bg-secondary, #161b22)',
    border: '1px solid var(--border-color, #30363d)',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    color: 'var(--text-primary, #c9d1d9)',
    transition: 'all 0.2s ease',
  },
  icon: {
    fontSize: '1rem',
  },
  label: {
    fontWeight: 500,
  },
  selector: {
    display: 'flex',
    gap: '0.5rem',
    background: 'var(--bg-secondary, #161b22)',
    border: '1px solid var(--border-color, #30363d)',
    borderRadius: '8px',
    padding: '0.25rem',
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem 0.75rem',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.8rem',
    color: 'var(--text-secondary, #8b949e)',
    transition: 'all 0.2s ease',
    flex: 1,
    justifyContent: 'center',
  },
  optionActive: {
    background: 'var(--accent-primary, #1f6feb)',
    color: '#fff',
  },
  optionIcon: {
    fontSize: '0.9rem',
  },
  optionLabel: {
    fontWeight: 500,
  },
  check: {
    fontSize: '0.7rem',
    marginLeft: '0.25rem',
  },
};
