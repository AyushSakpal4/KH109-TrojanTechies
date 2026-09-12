import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar, toggleTheme, selectTheme } from '../store/slices/uiSlice';
import { useMe } from '../api/hooks';
import styles from './Layout.module.css';

const navItems = [
  { to: '/org', label: 'Dashboard', icon: 'dashboard' },
  { to: '/org/requests', label: 'Requests', icon: 'assignment_ind' },
  { to: '/org/volunteers', label: 'Volunteers', icon: 'group' },
  { to: '/org/resources', label: 'Resources', icon: 'inventory_2' },
  { to: '/org/tasks', label: 'Tasks', icon: 'task_alt' },
  { to: '/org/zones', label: 'Zones', icon: 'map' },
  { to: '/org/activity-log', label: 'Activity Log', icon: 'history' },
  { to: '/org/profile', label: 'Profile', icon: 'apartment' },
];

export function OrgLayout() {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((s) => s.ui.sidebarOpen);
  const theme = useSelector(selectTheme);
  const { data: me } = useMe();
  const { user: clerkUser } = useUser();
  const role = me?.role ?? '—';

  const displayName = clerkUser
    ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.primaryEmailAddress?.emailAddress || 'Org User'
    : 'Org User';

  return (
    <div className={styles.wrapper}>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>apartment</span>
          </div>
          {sidebarOpen && (
            <h2 className={styles.brandName}>{me?.organization_name || 'Organization'}</h2>
          )}
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {sidebarOpen && <span className={styles.navLabel}>NAVIGATION</span>}
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              end={to === '/org'}
              title={label}
            >
              <span className={`material-symbols-outlined ${styles.navIcon}`}>{icon}</span>
              {sidebarOpen && <span className={styles.navText}>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User at bottom */}
        <div className={styles.userSection}>
          {sidebarOpen ? (
            <div className={styles.userInfo}>
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: { avatarBox: { width: '36px', height: '36px' } },
                }}
              />
              <div className={styles.userMeta}>
                <span className={styles.userName}>{displayName}</span>
                <span className={styles.userRole}>Organization</span>
              </div>
            </div>
          ) : (
            <div className={styles.userCollapsed}>
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: { avatarBox: { width: '32px', height: '32px' } },
                }}
              />
            </div>
          )}
        </div>
      </aside>

      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.menuBtn}
              onClick={() => dispatch(toggleSidebar())}
              aria-label="Toggle sidebar"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>menu</span>
            </button>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>
              Organization Panel
            </h3>
          </div>
          <div className={styles.headerRight}>
            <button
              type="button"
              className={styles.headerIcon}
              onClick={() => dispatch(toggleTheme())}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <button type="button" className={styles.headerIcon} aria-label="Notifications">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>notifications</span>
            </button>
            <div className={styles.divider} />
            <div className={styles.headerUser}>
              <div className={styles.headerAvatar}>
                <UserButton
                  afterSignOutUrl="/sign-in"
                  appearance={{
                    elements: { avatarBox: { width: '32px', height: '32px' } },
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
