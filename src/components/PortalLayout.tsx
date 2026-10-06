import { ReactNode } from 'react';
import { Shield, LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { BANK_INFO } from '@/lib/constants';
import './PortalLayout.css';

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

export function PortalLayout({
  navItems,
  activeSection,
  onSectionChange,
  children,
  userName,
  userRole,
  portalName,
  accentColor,
}: {
  navItems: NavItem[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  children: ReactNode;
  userName: string;
  userRole: string;
  portalName: string;
  accentColor: string;
}) {
  const { logout, setCurrentPortal } = useAuth();

  return (
    <div className="portal-layout">

      {/* Sidebar */}
      <aside className="portal-sidebar">

        <div className="portal-sidebar-brand">
          <div className="portal-brand-icon">
            <Shield size={20} />
          </div>

          <div className="portal-brand-info">
            <span className="portal-bank-name">
              {BANK_INFO.name}
            </span>

            <span className="portal-name">
              {portalName}
            </span>
          </div>
        </div>

        <nav className="portal-sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`portal-nav-item ${
                activeSection === item.id
                  ? 'portal-nav-item-active'
                  : ''
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="portal-sidebar-logout">
          <button
            onClick={() => {
              logout();
              setCurrentPortal('landing');
            }}
            className="portal-logout-button"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>

      </aside>

      {/* Mobile Top Bar */}
      <div className="portal-mobile-topbar">

        <div className="portal-mobile-brand">
          <div className="portal-mobile-icon">
            <Shield size={18} />
          </div>

          <span>{BANK_INFO.name}</span>
        </div>

        <button
          onClick={() => {
            logout();
            setCurrentPortal('landing');
          }}
          className="portal-mobile-logout"
          aria-label="Logout"
        >
          <LogOut size={20} />
        </button>

      </div>

      {/* Mobile Navigation */}
      <div className="portal-mobile-nav">

        <div className="portal-mobile-nav-inner">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`portal-mobile-nav-item ${
                activeSection === item.id
                  ? 'portal-mobile-nav-item-active'
                  : ''
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

      </div>

      {/* Main Content */}
      <div className="portal-main">

        <header className="portal-header">

          <div className="portal-header-title">
            <h2>
              {
                navItems.find(
                  (n) => n.id === activeSection
                )?.label || 'Dashboard'
              }
            </h2>

            <p>
              {userName} · {userRole}
            </p>
          </div>

          <div className="portal-header-actions">

            <button
              className="portal-notification-button"
              aria-label="Notifications"
            >
              <Bell size={22} />

              <span className="portal-notification-dot" />
            </button>

            <div
              className="portal-user-avatar"
              style={{ backgroundColor: accentColor }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>

          </div>

        </header>

        <main className="portal-content">
          {children}
        </main>

      </div>

    </div>
  );
}