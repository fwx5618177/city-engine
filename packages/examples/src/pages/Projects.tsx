import React from 'react';
import { FiExternalLink, FiFolder, FiGithub } from 'react-icons/fi';
import { Link } from 'react-router-dom';

import { projects } from '@/configs/projects';
import styles from '@/styles/pages/Projects.module.scss';

const Projects: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.projectsContainer}>
        <h1 className={styles.title}>Projects</h1>
        <div className={styles.grid}>
          {projects.map((project, index) => (
            <Link
              to={`/projects/${index}`}
              key={project.title}
              className={styles.projectCard}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={styles.projectCardGradient}
                style={{ background: project.gradient }}
              />
              <div className={styles.projectCardHeader}>
                <FiFolder className={styles.projectCardIcon} />
                <h3 className={styles.projectCardTitle}>{project.title}</h3>
              </div>
              <p className={styles.projectCardDescription}>
                {project.description}
              </p>
              <div className={styles.projectCardTags}>
                {project.technologies.map((tech) => (
                  <span key={tech} className={styles.projectCardTag}>
                    {tech}
                  </span>
                ))}
              </div>
              <div className={styles.projectCardActions}>
                <a href={project.githubUrl} className={styles.projectCardLink}>
                  <FiGithub /> GitHub
                </a>
                <a
                  href={project.demoUrl}
                  className={`${styles.projectCardLink} ${styles.secondary}`}
                >
                  <FiExternalLink /> Live Demo
                </a>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Projects;
