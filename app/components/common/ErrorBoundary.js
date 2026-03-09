'use client';
import { Component } from 'react';
import { colors, radius, spacing } from '../../lib/theme';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.bg,
          color: colors.text,
          padding: spacing.xl,
        }}>
          <div style={{ textAlign: 'center', maxWidth: 320 }}>
            <div style={{ fontSize: 40, marginBottom: spacing.md }}>{'⚠️'}</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: spacing.sm }}>Something went wrong</div>
            <div style={{ fontSize: 14, color: colors.textDim, marginBottom: spacing.xl }}>
              The app encountered an error. Try refreshing the page.
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: `${spacing.md}px ${spacing.xl}px`,
                borderRadius: radius.md,
                border: 'none',
                background: colors.gradient,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
