import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { ThemeToggle } from '@/components/ThemeToggle';
import styles from '@/styles/Layout.module.scss';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className={styles.appContainer}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link to="/" className={styles.logo}>
            City3D
          </Link>
          <div className={styles.navLinks}>
            <Link
              to="/"
              className={`${styles.navLink} ${
                location.pathname === '/' ? styles.active : ''
              }`}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`${styles.navLink} ${
                location.pathname === '/about' ? styles.active : ''
              }`}
            >
              About
            </Link>
            <Link
              to="/features"
              className={`${styles.navLink} ${
                location.pathname === '/features' ? styles.active : ''
              }`}
            >
              Features
            </Link>
            <Link
              to="/gallery"
              className={`${styles.navLink} ${
                location.pathname === '/gallery' ? styles.active : ''
              }`}
            >
              Gallery
            </Link>
            <Link
              to="/projects"
              className={`${styles.navLink} ${
                location.pathname === '/projects' ? styles.active : ''
              }`}
            >
              Projects
            </Link>
            <Link
              to="/docs"
              className={`${styles.navLink} ${
                location.pathname === '/docs' ? styles.active : ''
              }`}
            >
              Docs
            </Link>
            <Link
              to="/demo"
              className={`${styles.navLink} ${
                location.pathname === '/demo' ? styles.active : ''
              }`}
            >
              Demo
            </Link>
            <Link
              to="/contact"
              className={`${styles.navLink} ${
                location.pathname === '/contact' ? styles.active : ''
              }`}
            >
              Contact
            </Link>
          </div>
        </nav>
        <ThemeToggle />
      </header>
      <main className={styles.mainContent}>
        <Outlet />
        {children}
      </main>
    </div>
  );
};
