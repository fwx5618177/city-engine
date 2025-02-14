import React from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';

import { useTheme } from '@/context/ThemeContext';
import styles from '@/styles/ThemeToggle.module.scss';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className={styles.themeToggle}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <FiMoon /> : <FiSun />}
    </button>
  );
};
