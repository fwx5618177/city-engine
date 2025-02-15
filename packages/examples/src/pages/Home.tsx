import React from 'react';
import { FiArrowRight, FiBox, FiCpu, FiGlobe } from 'react-icons/fi';
import { Link } from 'react-router-dom';

import styles from '@/styles/pages/Home.module.scss';

const features = [
  {
    icon: <FiGlobe />,
    title: '全球规模',
    description: '以高性能构建和可视化整个城市。',
    gradient: 'linear-gradient(135deg, #3498db, #2ecc71)',
  },
  {
    icon: <FiCpu />,
    title: '实时处理',
    description: '高级算法实现即时更新和交互。',
    gradient: 'linear-gradient(135deg, #e74c3c, #f1c40f)',
  },
  {
    icon: <FiBox />,
    title: '3D 优化',
    description: '针对复杂3D环境的优化渲染。',
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
          <h1 className={styles.heroTitle}>3D 城市引擎</h1>
          <p className={styles.heroDescription}>
            使用我们强大的3D引擎构建、可视化和优化您的城市基础设施。
          </p>
          <div className={styles.heroActions}>
            <Link to="/demo" className={styles.actionButton}>
              尝试演示 <FiArrowRight />
            </Link>
            <Link
              to="/docs"
              className={`${styles.actionButton} ${styles.secondary}`}
            >
              文档
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className={styles.features}>
        <h2 className={styles.featuresTitle}>关键特性</h2>
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
          <h2 className={styles.ctaTitle}>准备好开始了吗？</h2>
          <p className={styles.ctaDescription}>
            加入数千名开发者，共同构建城市可视化的未来。
          </p>
          <Link to="/docs" className={styles.ctaButton}>
            开始使用 <FiArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
