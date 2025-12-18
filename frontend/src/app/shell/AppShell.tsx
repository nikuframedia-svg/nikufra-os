/**
 * AppShell - Layout principal da aplicação
 * Inclui Sidebar e área de conteúdo
 */

import { ReactNode } from 'react';
import { Sidebar } from '../../ui-kit/Sidebar';
import { BackendOfflineBanner } from '../../ui-kit/BackendOfflineBanner';
import { tokens } from '../../ui-kit/tokens';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: tokens.colors.background,
        fontFamily: tokens.typography.fontFamily,
      }}
    >
      <Sidebar />
      <BackendOfflineBanner />
      <main
        style={{
          flex: 1,
          marginLeft: '80px', // Sidebar width
          padding: tokens.spacing.xl,
          color: tokens.colors.text.body,
        }}
      >
        {children}
      </main>
    </div>
  );
}

