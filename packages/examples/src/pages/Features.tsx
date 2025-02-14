import React from 'react';
import {
  FiBox,
  FiCpu,
  FiGlobe,
  FiLayers,
  FiSettings,
  FiZap,
} from 'react-icons/fi';

import styles from '../styles/pages/Features.module.scss';

const features = [
  {
    icon: <FiBox />,
    title: '3D Model Support',
    description:
      'Import and render complex 3D models with high performance optimization.',
    gradient: 'linear-gradient(135deg, #3498db, #2ecc71)',
  },
  {
    icon: <FiCpu />,
    title: 'Real-time Processing',
    description:
      'Advanced algorithms for real-time rendering and physics calculations.',
    gradient: 'linear-gradient(135deg, #e74c3c, #f1c40f)',
  },
  {
    icon: <FiGlobe />,
    title: 'Global Scale',
    description:
      'Support for large-scale city environments with efficient LOD management.',
    gradient: 'linear-gradient(135deg, #9b59b6, #3498db)',
  },
  {
    icon: <FiLayers />,
    title: 'Multi-layer Architecture',
    description:
      'Flexible layering system for buildings, infrastructure, and terrain.',
    gradient: 'linear-gradient(135deg, #2ecc71, #1abc9c)',
  },
  {
    icon: <FiZap />,
    title: 'High Performance',
    description:
      'Optimized for maximum performance with minimal resource usage.',
    gradient: 'linear-gradient(135deg, #f1c40f, #e67e22)',
  },
  {
    icon: <FiSettings />,
    title: 'Customizable',
    description:
      'Extensive configuration options for different use cases and requirements.',
    gradient: 'linear-gradient(135deg, #34495e, #95a5a6)',
  },
];

const Features: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.featuresContainer}>
        <h1 className={styles.title}>Features</h1>
        <div className={styles.grid}>
          {features.map((feature, index) => (
            <div
              key={index}
              className={`${styles.card} ${styles.featureCard}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={styles.featureCardGradient}
                style={{ background: feature.gradient }}
              />
              <div
                className={styles.featureCardIcon}
                style={{ background: feature.gradient }}
              >
                {feature.icon}
              </div>
              <h3 className={styles.featureCardTitle}>{feature.title}</h3>
              <p className={styles.featureCardDescription}>
                {feature.description}
              </p>
              <button className={styles.featureCardButton}>Learn More</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
