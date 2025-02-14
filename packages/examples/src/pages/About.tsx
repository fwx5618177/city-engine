import React from 'react';
import { Link } from 'react-router-dom';

import styles from '@/styles/pages/About.module.scss';

const About: React.FC = () => (
  <div className={styles.container}>
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        City3D
      </Link>
      <div className={styles.navLinks}>
        <Link to="/" className={styles.navLink}>
          Home
        </Link>
        <Link to="/about" className={`${styles.navLink} ${styles.active}`}>
          About
        </Link>
        <Link to="/gallery" className={styles.navLink}>
          Gallery
        </Link>
        <Link to="/contact" className={styles.navLink}>
          Contact
        </Link>
      </div>
    </nav>

    <main className={styles.content}>
      <section className={styles.teamSection}>
        <h2 className={styles.sectionTitle}>Our Team</h2>
        <div className={styles.teamGrid}>
          <div className={styles.teamCard}>
            <h3>Urban Planners</h3>
            <p>
              Expertise in city layout optimization and traffic flow simulation
            </p>
          </div>
          <div className={styles.teamCard}>
            <h3>3D Engineers</h3>
            <p>Specialists in WebGL, Three.js and Babylon.js implementations</p>
          </div>
          <div className={styles.teamCard}>
            <h3>Data Analysts</h3>
            <p>Performance metrics and simulation data visualization experts</p>
          </div>
        </div>
      </section>

      <section className={styles.techStack}>
        <h2 className={styles.sectionTitle}>Technology Stack</h2>
        <div className={styles.techGrid}>
          <div className={styles.techItem}>
            <h3>React 18</h3>
            <p>Core framework for building interactive UI components</p>
          </div>
          <div className={styles.techItem}>
            <h3>TypeScript</h3>
            <p>Type-safe development experience</p>
          </div>
          <div className={styles.techItem}>
            <h3>Three.js</h3>
            <p>WebGL-based 3D rendering engine</p>
          </div>
        </div>
      </section>
    </main>
  </div>
);

export default About;
