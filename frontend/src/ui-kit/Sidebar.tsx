/**
 * Sidebar - Navegação lateral fixa por módulos
 * Integra feature gates para mostrar/esconder itens
 */

import { NavLink } from 'react-router-dom';
import { tokens } from './tokens';
import { useEffect, useState } from 'react';
import { isFeatureEnabled } from '../api/feature-gates';

interface SidebarItem {
  path: string;
  label: string;
  icon: string;
  module: string;
  featureGate?: string; // Feature gate para verificar se deve mostrar
}

const sidebarItems: SidebarItem[] = [
  { path: '/prodplan/overview', label: 'PRODPLAN', icon: '📊', module: 'prodplan' },
  { path: '/smartinventory/overview', label: 'SMARTINVENTORY', icon: '🛒', module: 'smartinventory' },
  { path: '/whatif/simulate', label: 'WHAT-IF', icon: '🔬', module: 'whatif' },
  { path: '/quality/overview', label: 'QUALITY / ZDM', icon: '✅', module: 'quality' },
  { path: '/ml/predict/leadtime', label: 'ML / R&D', icon: '🧠', module: 'ml' },
  { path: '/ops/ingestion', label: 'OPS', icon: '⚙️', module: 'ops' },
  { path: '/chat', label: 'CHAT', icon: '💬', module: 'chat' },
];

export function Sidebar() {
  const [enabledItems, setEnabledItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check feature gates for each item
    const checkGates = async () => {
      const enabled = new Set<string>();
      for (const item of sidebarItems) {
        if (!item.featureGate || isFeatureEnabled(item.featureGate)) {
          enabled.add(item.path);
        }
      }
      setEnabledItems(enabled);
    };
    checkGates();
  }, []);

  const baseStyle: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    top: 0,
    width: '80px',
    height: '100vh',
    backgroundColor: tokens.colors.card.elevated,
    borderRight: `1px solid ${tokens.colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: tokens.spacing.lg,
    zIndex: 10,
  };

  const linkStyle: React.CSSProperties = {
    width: 'calc(100% - 16px)',
    padding: tokens.spacing.md,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    textDecoration: 'none',
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.fontSize.label,
    fontWeight: tokens.typography.fontWeight.regular,
    fontFamily: tokens.typography.fontFamily,
    transition: tokens.transitions.default,
    borderRadius: tokens.borderRadius.button,
    marginBottom: tokens.spacing.xs,
    cursor: 'pointer',
  };

  const activeLinkStyle: React.CSSProperties = {
    ...linkStyle,
    backgroundColor: tokens.colors.card.default,
    color: tokens.colors.primary.default,
  };

  const disabledLinkStyle: React.CSSProperties = {
    ...linkStyle,
    opacity: 0.4,
    cursor: 'not-allowed',
  };

  return (
    <nav style={baseStyle}>
      {sidebarItems.map((item) => {
        const isEnabled = enabledItems.has(item.path) || !item.featureGate;
        const style = isEnabled ? linkStyle : disabledLinkStyle;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => (isActive ? activeLinkStyle : style)}
            title={item.label}
            onClick={(e) => {
              if (!isEnabled) {
                e.preventDefault();
              }
            }}
          >
            {item.icon && <span style={{ fontSize: '24px' }}>{item.icon}</span>}
          </NavLink>
        );
      })}
    </nav>
  );
}
