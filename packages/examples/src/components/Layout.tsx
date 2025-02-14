import React from 'react';
import { Outlet } from 'react-router-dom';

import Header from './Header';

import styles from '@/styles/Layout.module.scss';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className={styles.appContainer}>
      <Header />
      <main className={styles.mainContent}>
        <Outlet />
        {children}
      </main>
    </div>
  );
};
