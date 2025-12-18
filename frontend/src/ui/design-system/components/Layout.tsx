/**
 * Layout Components - AppShell, SideNav, TopBar, PageHeader
 * Industrial: compacto, navegação clara, sem desperdício
 */

import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { tokens } from '../tokens';
import { DataFreshnessChip } from './States';

// ============================================
// SIDENAV
// ============================================
interface NavItem {
  path: string;
  label: string;
  icon: string;
  module: string;
  disabled?: boolean;
  disabledReason?: string;
  children?: Omit<NavItem, 'children'>[];
}

const navItems: NavItem[] = [
  {
    path: '/prodplan',
    label: 'PRODPLAN',
    icon: '📊',
    module: 'prodplan',
    children: [
      { path: '/prodplan/overview', label: 'Overview', icon: '📈', module: 'prodplan' },
      { path: '/prodplan/orders', label: 'Orders', icon: '📋', module: 'prodplan' },
      { path: '/prodplan/schedule', label: 'Schedule', icon: '📅', module: 'prodplan' },
      { path: '/prodplan/bottlenecks', label: 'Bottlenecks', icon: '🔴', module: 'prodplan' },
      { path: '/prodplan/risk-queue', label: 'Risk Queue', icon: '⚠️', module: 'prodplan' },
    ],
  },
  {
    path: '/smartinventory',
    label: 'INVENTORY',
    icon: '📦',
    module: 'smartinventory',
    children: [
      { path: '/smartinventory/overview', label: 'Overview', icon: '📊', module: 'smartinventory' },
      { path: '/smartinventory/wip', label: 'WIP Explorer', icon: '🔍', module: 'smartinventory' },
      { path: '/smartinventory/wip-mass', label: 'WIP Mass', icon: '⚖️', module: 'smartinventory' },
      { path: '/smartinventory/gelcoat', label: 'Gelcoat', icon: '🎨', module: 'smartinventory' },
    ],
  },
  {
    path: '/quality',
    label: 'QUALITY',
    icon: '✅',
    module: 'quality',
    children: [
      { path: '/quality/overview', label: 'Overview', icon: '📊', module: 'quality' },
      { path: '/quality/by-phase', label: 'By Phase', icon: '📍', module: 'quality' },
      { path: '/quality/risk', label: 'Risk', icon: '⚠️', module: 'quality' },
    ],
  },
  {
    path: '/whatif',
    label: 'WHAT-IF',
    icon: '🔬',
    module: 'whatif',
    children: [
      { path: '/whatif/simulate', label: 'Simulator', icon: '🎮', module: 'whatif' },
    ],
  },
  {
    path: '/ml',
    label: 'ML / R&D',
    icon: '🧠',
    module: 'ml',
    children: [
      { path: '/ml/predict/leadtime', label: 'Predict LT', icon: '⏱️', module: 'ml' },
      { path: '/ml/explain/leadtime', label: 'Explain LT', icon: '💡', module: 'ml' },
      { path: '/ml/train', label: 'Training', icon: '🎯', module: 'ml' },
    ],
  },
  {
    path: '/ops',
    label: 'OPS',
    icon: '⚙️',
    module: 'ops',
    children: [
      { path: '/ops/health', label: 'Health', icon: '💚', module: 'ops' },
      { path: '/ops/ingestion', label: 'Ingestion', icon: '📥', module: 'ops' },
      { path: '/ops/data-contract', label: 'Data Contract', icon: '📜', module: 'ops' },
      { path: '/ops/feature-gates', label: 'Feature Gates', icon: '🚦', module: 'ops' },
    ],
  },
];

interface SideNavProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const SideNav: React.FC<SideNavProps> = ({ collapsed = false, onToggle }) => {
  const location = useLocation();
  const [expandedModule, setExpandedModule] = useState<string | null>(
    navItems.find(item => location.pathname.startsWith(item.path))?.module || null
  );

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: collapsed ? '48px' : tokens.sizes.sideNav,
      height: '100vh',
      backgroundColor: tokens.colors.surface.primary,
      borderRight: `1px solid ${tokens.colors.border.default}`,
      display: 'flex',
      flexDirection: 'column',
      zIndex: tokens.zIndex.sticky,
      transition: tokens.transitions.normal,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        height: tokens.sizes.topBar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: `1px solid ${tokens.colors.border.subtle}`,
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: collapsed ? '16px' : '14px',
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.colors.accent.primary,
        }}>
          {collapsed ? '◈' : 'PP4'}
        </span>
      </div>

      {/* Nav Items */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: tokens.spacing['1'],
      }}>
        {navItems.map((item) => (
          <div key={item.path}>
            {/* Parent item */}
            <NavLink
              to={item.children ? item.children[0].path : item.path}
              onClick={(e) => {
                if (item.disabled) {
                  e.preventDefault();
                  return;
                }
                if (item.children) {
                  setExpandedModule(expandedModule === item.module ? null : item.module);
                }
              }}
              title={item.disabled ? item.disabledReason : item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: tokens.spacing['2'],
                padding: collapsed ? tokens.spacing['2'] : `${tokens.spacing['2']} ${tokens.spacing['3']}`,
                marginBottom: tokens.spacing['1'],
                borderRadius: tokens.radius.md,
                textDecoration: 'none',
                color: item.disabled 
                  ? tokens.colors.text.muted 
                  : isActive(item.path) 
                    ? tokens.colors.accent.primary 
                    : tokens.colors.text.secondary,
                backgroundColor: isActive(item.path) 
                  ? tokens.colors.accent.primaryMuted 
                  : 'transparent',
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.semibold,
                letterSpacing: tokens.typography.letterSpacing.uppercase,
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                opacity: item.disabled ? 0.5 : 1,
                transition: tokens.transitions.fast,
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>

            {/* Children */}
            {!collapsed && item.children && expandedModule === item.module && (
              <div style={{
                marginLeft: tokens.spacing['4'],
                borderLeft: `1px solid ${tokens.colors.border.subtle}`,
                paddingLeft: tokens.spacing['2'],
                marginBottom: tokens.spacing['2'],
              }}>
                {item.children.map((child) => (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    title={child.disabled ? child.disabledReason : child.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: tokens.spacing['1'],
                      padding: `${tokens.spacing['1']} ${tokens.spacing['2']}`,
                      borderRadius: tokens.radius.sm,
                      textDecoration: 'none',
                      color: child.disabled 
                        ? tokens.colors.text.muted 
                        : location.pathname === child.path 
                          ? tokens.colors.accent.primary 
                          : tokens.colors.text.tertiary,
                      backgroundColor: location.pathname === child.path 
                        ? tokens.colors.accent.primaryMuted 
                        : 'transparent',
                      fontSize: tokens.typography.fontSize.xs,
                      cursor: child.disabled ? 'not-allowed' : 'pointer',
                      opacity: child.disabled ? 0.5 : 1,
                      transition: tokens.transitions.fast,
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>{child.icon}</span>
                    <span>{child.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Collapse toggle */}
      {onToggle && (
        <button
          onClick={onToggle}
          style={{
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            borderTop: `1px solid ${tokens.colors.border.subtle}`,
            color: tokens.colors.text.muted,
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          {collapsed ? '→' : '←'}
        </button>
      )}
    </nav>
  );
};

// ============================================
// TOPBAR
// ============================================
interface TopBarProps {
  lastUpdated?: string;
  children?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({ lastUpdated, children }) => (
  <header style={{
    height: tokens.sizes.topBar,
    backgroundColor: tokens.colors.surface.primary,
    borderBottom: `1px solid ${tokens.colors.border.default}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `0 ${tokens.spacing['4']}`,
    position: 'sticky',
    top: 0,
    zIndex: tokens.zIndex.sticky,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing['3'] }}>
      {children}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing['3'] }}>
      {lastUpdated && <DataFreshnessChip lastUpdated={lastUpdated} source="ingestion" />}
    </div>
  </header>
);

// ============================================
// PAGE HEADER
// ============================================
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; path?: string }[];
  actions?: React.ReactNode;
  lastUpdated?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  lastUpdated,
}) => (
  <div style={{
    marginBottom: tokens.spacing['4'],
    paddingBottom: tokens.spacing['3'],
    borderBottom: `1px solid ${tokens.colors.border.subtle}`,
  }}>
    {/* Breadcrumbs */}
    {breadcrumbs && breadcrumbs.length > 0 && (
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacing['1'],
        marginBottom: tokens.spacing['2'],
      }}>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <span style={{ color: tokens.colors.text.muted, fontSize: tokens.typography.fontSize.xs }}>
                /
              </span>
            )}
            {crumb.path ? (
              <NavLink
                to={crumb.path}
                style={{
                  color: tokens.colors.text.tertiary,
                  fontSize: tokens.typography.fontSize.xs,
                  textDecoration: 'none',
                }}
              >
                {crumb.label}
              </NavLink>
            ) : (
              <span style={{
                color: tokens.colors.text.secondary,
                fontSize: tokens.typography.fontSize.xs,
              }}>
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>
    )}

    {/* Title row */}
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    }}>
      <div>
        <h1 style={{
          fontSize: tokens.typography.fontSize['2xl'],
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.colors.text.primary,
          margin: 0,
          fontFamily: tokens.typography.fontFamily.sans,
          letterSpacing: tokens.typography.letterSpacing.tight,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.text.tertiary,
            margin: `${tokens.spacing['1']} 0 0`,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing['3'] }}>
        {lastUpdated && <DataFreshnessChip lastUpdated={lastUpdated} />}
        {actions}
      </div>
    </div>
  </div>
);

// ============================================
// APP SHELL
// ============================================
interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [sideNavCollapsed, setSideNavCollapsed] = useState(false);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: tokens.colors.background,
      fontFamily: tokens.typography.fontFamily.sans,
      color: tokens.colors.text.primary,
    }}>
      <SideNav 
        collapsed={sideNavCollapsed} 
        onToggle={() => setSideNavCollapsed(!sideNavCollapsed)} 
      />
      <main style={{
        marginLeft: sideNavCollapsed ? '48px' : tokens.sizes.sideNav,
        minHeight: '100vh',
        transition: tokens.transitions.normal,
      }}>
        {children}
      </main>
    </div>
  );
};

