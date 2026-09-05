import { useState } from 'react';
import Navbar from './components/Navbar';
import OverviewTab from './components/OverviewTab';
import BreakdownTab from './components/BreakdownTab';
import AuditTrailTab from './components/AuditTrailTab';

export type Tab = 'overview' | 'breakdown' | 'audit';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="min-h-screen" style={{ background: 'var(--canvas)', color: '#dfe2ee' }}>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="tab-content">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'breakdown' && <BreakdownTab />}
        {activeTab === 'audit' && <AuditTrailTab />}
      </main>
    </div>
  );
}
