import React, { Suspense, lazy } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';

import { projects } from '@/configs/projects';
import styles from '@/styles/pages/ProjectDetails.module.scss';

// 动态导入 demo 组件
const DemoComponents: {
  [key: string]: React.LazyExoticComponent<React.ComponentType>;
} = {
  'city-3d': lazy(() => import('@/demos/InteractDemo')),
  'city-car': lazy(() => import('@/demos/CityTour')),
  'city-gis': lazy(() => import('@/demos/CityGIS')),
};

const ProjectDetails: React.FC = () => {
  const { id } = useParams();
  const project = projects[Number(id)];

  if (!project) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          <h2>项目未找到</h2>
          <Link to="/projects" className={styles.backButton}>
            <FiArrowLeft /> 返回项目
          </Link>
        </div>
      </div>
    );
  }

  const DemoComponent = DemoComponents[project.demoKey];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/projects" className={styles.backButton}>
          <FiArrowLeft /> 返回项目
        </Link>
      </div>

      <div className={styles.content}>
        <div
          className={styles.projectBanner}
          style={{ background: project.gradient }}
        >
          <h1 className={styles.projectTitle}>{project.title}</h1>
        </div>

        <div className={styles.projectInfo}>
          <div className={styles.description}>
            <h2>关于项目</h2>
            <p>{project.description}</p>
          </div>

          <div className={styles.technologies}>
            <h2>技术栈</h2>
            <div className={styles.techGrid}>
              {project.technologies.map((tech) => (
                <span key={tech} className={styles.techTag}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.demoContainer}>
          <h2>在线演示</h2>
          <div className={styles.demoWrapper}>
            <Suspense
              fallback={<div className={styles.demoLoading}>加载演示中...</div>}
            >
              {DemoComponent && <DemoComponent />}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
