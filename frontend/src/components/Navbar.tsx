import type { Tab } from '../App';

interface NavbarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'breakdown', label: 'Breakdown' },
  { id: 'audit', label: 'Audit Trail' },
];

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: 'rgba(15, 19, 28, 0.85)',
        backdropFilter: 'blur(12px)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-sm"
              style={{ background: 'var(--teal)', color: 'var(--canvas)' }}
            >
              R
            </div>
            <div>
              <span className="font-semibold text-base" style={{ color: '#f8fafc' }}>Revive</span>
              <span className="ml-2 text-label font-mono" style={{ color: 'var(--teal-muted)' }}>
                RECOVERY ENGINE
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1" style={{ background: 'var(--surface)' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150"
                style={{
                  color: activeTab === tab.id ? 'var(--canvas)' : '#94a3b8',
                  background: activeTab === tab.id ? 'var(--teal)' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (activeTab !== tab.id) {
                    (e.currentTarget as HTMLButtonElement).style.color = '#f8fafc';
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-hover)';
                  }
                }}
                onMouseLeave={e => {
                  if (activeTab !== tab.id) {
                    (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
