'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.props.onError?.(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={styles.container}>
          <div style={styles.icon}>⚠️</div>
          <h3 style={styles.title}>Something went wrong</h3>
          <p style={styles.message}>{this.state.error?.message || 'Unknown error'}</p>
          <button onClick={this.handleRetry} style={styles.retryButton}>
            🔄 Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Card-level error boundary with compact UI
export function CardErrorBoundary({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <ErrorBoundary
      fallback={
        <div style={cardStyles.container}>
          <div style={cardStyles.header}>
            <h3 style={cardStyles.title}>{title}</h3>
          </div>
          <div style={cardStyles.errorContent}>
            <span style={cardStyles.icon}>⚠️</span>
            <span style={cardStyles.text}>Failed to load</span>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    background: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '12px',
    textAlign: 'center',
    minHeight: '200px'
  },
  icon: {
    fontSize: '3rem',
    marginBottom: '1rem'
  },
  title: {
    color: '#c9d1d9',
    margin: '0 0 0.5rem 0',
    fontSize: '1.25rem'
  },
  message: {
    color: '#8b949e',
    fontSize: '0.875rem',
    margin: '0 0 1.5rem 0'
  },
  retryButton: {
    background: '#1f6feb',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'background 0.2s'
  }
};

const cardStyles: Record<string, React.CSSProperties> = {
  container: {
    background: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '12px',
    padding: '1.5rem'
  },
  header: {
    marginBottom: '1rem'
  },
  title: {
    fontSize: '1rem',
    color: '#58a6ff',
    margin: 0,
    fontWeight: 600
  },
  errorContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '2rem',
    color: '#8b949e'
  },
  icon: {
    fontSize: '1.25rem'
  },
  text: {
    fontSize: '0.9rem'
  }
};
