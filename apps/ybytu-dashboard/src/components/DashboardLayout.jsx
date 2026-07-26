import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function DashboardLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar />
      <div className="yb-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Outlet /> 
      </div>
      <MobileNav />
    </div>
  );
}