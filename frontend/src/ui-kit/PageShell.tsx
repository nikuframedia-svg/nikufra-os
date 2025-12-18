/**
 * PageShell - Container principal para todas as páginas
 * Inclui Sidebar e Topbar para layout consistente
 */
import { ReactNode } from 'react';
import { tokens } from './tokens';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface PageShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function PageShell({ children, title, description, className = '' }: PageShellProps) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: tokens.colors.background,
        fontFamily: tokens.typography.fontFamily,
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar title={title} description={description} />
        <main
          className={className}
          style={{
            flex: 1,
            padding: tokens.spacing.lg,
            overflowY: 'auto',
            marginLeft: '80px', // Offset for sidebar
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

