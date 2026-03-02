'use client';

import React from 'react';

interface UseKeyboardShortcutsOptions {
  onRefresh?: () => void;
  onTabChange?: (tab: string) => void;
  tabs?: string[];
}

export function useKeyboardShortcuts({ 
  onRefresh, 
  onTabChange,
  tabs = []
}: UseKeyboardShortcutsOptions) {
  const [showHelp, setShowHelp] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // ? - Show/hide help
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowHelp(prev => !prev);
        return;
      }

      // r or R - Refresh data
      if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onRefresh?.();
        return;
      }

      // 1-9 - Switch tabs
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= tabs.length) {
        e.preventDefault();
        onTabChange?.(tabs[num - 1]);
        return;
      }

      // Arrow keys - Navigate tabs
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const currentIndex = tabs.findIndex(t => 
          typeof window !== 'undefined' && 
          window.location.hash.includes(t)
        );
        if (currentIndex >= 0) {
          const newIndex = e.key === 'ArrowLeft' 
            ? Math.max(0, currentIndex - 1)
            : Math.min(tabs.length - 1, currentIndex + 1);
          onTabChange?.(tabs[newIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRefresh, onTabChange, tabs]);

  // Auto-hide help after 5 seconds
  React.useEffect(() => {
    if (showHelp) {
      const timer = setTimeout(() => setShowHelp(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showHelp]);

  return { showHelp, setShowHelp };
}

export function KeyboardShortcutsHelp({ 
  visible, 
  onClose 
}: { 
  visible: boolean; 
  onClose: () => void;
}) {
  if (!visible) return null;

  const shortcuts = [
    { key: '?', description: 'Toggle this help' },
    { key: 'R', description: 'Refresh all data' },
    { key: '1-3', description: 'Switch to tab 1-3' },
    { key: '← →', description: 'Navigate tabs' },
  ];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>⌨️ Keyboard Shortcuts</h3>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>
        <div style={styles.list}>
          {shortcuts.map(({ key, description }) => (
            <div key={key} style={styles.item}>
              <kbd style={styles.key}>{key}</kbd>
              <span style={styles.description}>{description}</span>
            </div>
          ))}
        </div>
        <div style={styles.footer}>
          Press <kbd style={styles.inlineKey}>?</kbd> anytime to show this help
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  modal: {
    background: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '12px',
    padding: '1.5rem',
    minWidth: '320px',
    maxWidth: '400px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    borderBottom: '1px solid #30363d',
    paddingBottom: '0.75rem'
  },
  title: {
    margin: 0,
    color: '#c9d1d9',
    fontSize: '1.1rem'
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#8b949e',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  key: {
    background: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '4px',
    padding: '0.25rem 0.5rem',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    color: '#58a6ff',
    minWidth: '40px',
    textAlign: 'center'
  },
  description: {
    color: '#c9d1d9',
    fontSize: '0.9rem'
  },
  footer: {
    marginTop: '1rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #30363d',
    color: '#8b949e',
    fontSize: '0.8rem',
    textAlign: 'center'
  },
  inlineKey: {
    background: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '3px',
    padding: '0.125rem 0.375rem',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    color: '#58a6ff'
  }
};
