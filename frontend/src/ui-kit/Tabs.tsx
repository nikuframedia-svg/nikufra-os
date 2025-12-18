/**
 * Tabs - Navegação por abas
 */
// ReactNode is a type-only import
import { tokens } from './tokens';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className = '' }: TabsProps) {
  const tabStyle: React.CSSProperties = {
    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: `2px solid transparent`,
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.fontSize.body.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    fontFamily: tokens.typography.fontFamily,
    cursor: 'pointer',
    transition: tokens.transitions.default,
  };

  const activeTabStyle: React.CSSProperties = {
    ...tabStyle,
    color: tokens.colors.primary.default,
    borderBottomColor: tokens.colors.primary.default,
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: tokens.spacing.sm,
        borderBottom: `1px solid ${tokens.colors.border}`,
      }}
      className={className}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          style={activeTab === tab.id ? activeTabStyle : tabStyle}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

