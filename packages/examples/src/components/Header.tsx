import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { ThemeToggle } from '@/components/ThemeToggle';
import styles from '@/styles/header.module.scss';

const Header = () => {
  const location = useLocation();

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.logo}>
          城市3D
        </Link>
        <div className={styles.navLinks}>
          <Link
            to="/"
            className={`${styles.navLink} ${
              location.pathname === '/' ? styles.active : ''
            }`}
          >
            首页
          </Link>
          <Link
            to="/projects"
            className={`${styles.navLink} ${
              location.pathname === '/projects' ? styles.active : ''
            }`}
          >
            项目
          </Link>
        </div>
      </nav>
      <ThemeToggle />
    </header>
  );
};

export default Header;
