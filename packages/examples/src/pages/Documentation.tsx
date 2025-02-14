import React from 'react';
import { FiBook, FiCode, FiFileText, FiGitBranch } from 'react-icons/fi';

import styles from '../styles/pages/Documentation.module.scss';

const docSections = [
  {
    icon: <FiBook />,
    title: 'Getting Started',
    content: 'Learn how to set up and initialize your first 3D city project.',
    gradient: 'linear-gradient(135deg, #3498db, #2ecc71)',
  },
  {
    icon: <FiCode />,
    title: 'API Reference',
    content:
      'Comprehensive documentation of all available APIs and their usage.',
    gradient: 'linear-gradient(135deg, #e74c3c, #f1c40f)',
  },
  {
    icon: <FiFileText />,
    title: 'Examples',
    content:
      'Real-world examples and use cases to help you understand the implementation.',
    gradient: 'linear-gradient(135deg, #9b59b6, #3498db)',
  },
  {
    icon: <FiGitBranch />,
    title: 'Contributing',
    content:
      'Guidelines for contributing to the project and improving the engine.',
    gradient: 'linear-gradient(135deg, #2ecc71, #1abc9c)',
  },
];

const Documentation: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.docsContainer}>
        <h1 className={styles.title}>Documentation</h1>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search documentation..."
            className={styles.searchInput}
          />
          <button className={styles.searchButton}>Search</button>
        </div>

        <div className={styles.sectionList}>
          {docSections.map((section, index) => (
            <div
              key={index}
              className={styles.sectionCard}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={styles.sectionGradient}
                style={{ background: section.gradient }}
              />
              <div
                className={styles.sectionIcon}
                style={{ background: section.gradient }}
              >
                {section.icon}
              </div>
              <div className={styles.sectionContent}>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                <p className={styles.sectionDescription}>{section.content}</p>
                <div className={styles.sectionActions}>
                  <button className={styles.button}>Read More</button>
                  <button className={`${styles.button} ${styles.secondary}`}>
                    View Examples
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Documentation;
