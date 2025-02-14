import React from 'react';
import { FiArrowRight, FiBox, FiCpu, FiGlobe } from 'react-icons/fi';
import { Link } from 'react-router-dom';

import styles from '@/styles/pages/Home.module.scss';

const features = [
  {
    icon: <FiGlobe />,
    title: 'Global Scale',
    description: 'Build and visualize entire cities with high performance.',
    gradient: 'linear-gradient(135deg, #3498db, #2ecc71)',
  },
  {
    icon: <FiCpu />,
    title: 'Real-time Processing',
    description: 'Advanced algorithms for instant updates and interactions.',
    gradient: 'linear-gradient(135deg, #e74c3c, #f1c40f)',
  },
  {
    icon: <FiBox />,
    title: '3D Optimization',
    description: 'Optimized rendering for complex 3D environments.',
    gradient: 'linear-gradient(135deg, #9b59b6, #3498db)',
  },
];

const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>3D City Engine</h1>
          <p className={styles.heroDescription}>
            Build, visualize, and optimize your city infrastructure with our
            powerful 3D engine.
          </p>
          <div className={styles.heroActions}>
            <Link to="/demo" className={styles.actionButton}>
              Try Demo <FiArrowRight />
            </Link>
            <Link
              to="/docs"
              className={`${styles.actionButton} ${styles.secondary}`}
            >
              Documentation
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className={styles.features}>
        <h2 className={styles.featuresTitle}>Key Features</h2>
        <div className={styles.grid}>
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={styles.card}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={styles.featuresCardGradient}
                style={{ background: feature.gradient }}
              />
              <div
                className={styles.featuresCardIcon}
                style={{ background: feature.gradient }}
              >
                {feature.icon}
              </div>
              <h3 className={styles.featuresCardTitle}>{feature.title}</h3>
              <p className={styles.featuresCardDescription}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className={styles.cta}>
        <div className={styles.ctaContainer}>
          <h2 className={styles.ctaTitle}>Ready to Get Started?</h2>
          <p className={styles.ctaDescription}>
            Join thousands of developers building the future of urban
            visualization.
          </p>
          <Link to="/docs" className={styles.ctaButton}>
            Get Started <FiArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
