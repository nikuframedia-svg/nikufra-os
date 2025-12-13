import React from 'react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div style={{ 
      width: '100%',
      minHeight: '100vh', 
      background: '#212024',
      position: 'relative',
    }}>
      <Sidebar />
      <div style={{ 
        marginLeft: 80,
        width: 'calc(100% - 80px)',
        position: 'relative',
      }}>
        {children}
      </div>
    </div>
  );
}
