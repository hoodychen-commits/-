import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { Gift, Award, User, LogOut, Settings } from 'lucide-react';
import { getProfile } from './api';
import './index.css';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import LeaderboardHome from './pages/LeaderboardHome';
import MemberStore from './pages/MemberStore';
import MemberProfile from './pages/MemberProfile';
import MemberQRScan from './pages/MemberQRScan';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';

function AuthWrapper({ children, requireRole }: { children: React.ReactNode, requireRole?: 'admin' | 'member' }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    getProfile().then((data) => {
      if (requireRole && data.role !== requireRole) {
        navigate('/');
      } else {
        setLoading(false);
      }
    }).catch(() => {
      localStorage.removeItem('token');
      navigate('/login');
    });
  }, [navigate, requireRole]);

  if (loading) return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>讀取中...</div>;

  return <>{children}</>;
}

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role') || 'member';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
    <Link to={to} className={`nav-link ${location.pathname === to ? 'active' : ''}`} style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
      {icon} {label}
    </Link>
  );

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gift size={24} />
          天使點數系統
        </Link>
        <div className="nav-links">
          {role === 'member' ? (
            <>
              <NavItem to="/" icon={<Award size={18} />} label="排行與點數" />
              <NavItem to="/store" icon={<Gift size={18} />} label="點數商城" />
              <NavItem to="/profile" icon={<User size={18} />} label="個人中心" />
            </>
          ) : (
            <>
              <NavItem to="/admin" icon={<Settings size={18} />} label="儀表板與發點" />
              <NavItem to="/admin/products" icon={<Gift size={18} />} label="商品管理" />
            </>
          )}
          <button onClick={handleLogout} className="btn" style={{ padding: '0.5rem 1rem', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
            <LogOut size={18} /> 登出
          </button>
        </div>
      </div>
    </nav>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Navigation />
      <main className="container">
        {children}
      </main>
    </div>
  );
}

function AppRouter() {
  const role = localStorage.getItem('role');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Member Routes */}
        <Route path="/" element={<AuthWrapper requireRole="member"><Layout><LeaderboardHome /></Layout></AuthWrapper>} />
        <Route path="/store" element={<AuthWrapper requireRole="member"><Layout><MemberStore /></Layout></AuthWrapper>} />
        <Route path="/profile" element={<AuthWrapper requireRole="member"><Layout><MemberProfile /></Layout></AuthWrapper>} />
        <Route path="/scan" element={<AuthWrapper requireRole="member"><Layout><MemberQRScan /></Layout></AuthWrapper>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AuthWrapper requireRole="admin"><Layout><AdminDashboard /></Layout></AuthWrapper>} />
        <Route path="/admin/products" element={<AuthWrapper requireRole="admin"><Layout><AdminProducts /></Layout></AuthWrapper>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to={role === 'admin' ? '/admin' : '/'} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
