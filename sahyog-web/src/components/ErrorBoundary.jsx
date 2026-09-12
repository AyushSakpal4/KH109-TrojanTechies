import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown error' };
  }

  componentDidCatch(error, info) {
    console.error('UI ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            background: 'var(--color-bg)',
          }}
        >
          <div
            style={{
              maxWidth: 560,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 14,
              padding: 20,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
            <p>{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: 10,
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                padding: '8px 12px',
                background: 'var(--color-surface)',
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
