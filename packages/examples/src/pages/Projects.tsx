import React from 'react';
import { FiExternalLink, FiFolder, FiGithub } from 'react-icons/fi';

import styles from '@/styles/pages/Projects.module.scss';

interface Project {
  title: string;
  description: string;
  technologies: string[];
  githubUrl: string;
  demoUrl: string;
  gradient: string;
}

const projects: Project[] = [
  {
    title: 'Smart City Dashboard',
    description:
      'Real-time monitoring and visualization of city infrastructure and services.',
    technologies: ['React', 'Three.js', 'WebGL', 'TypeScript'],
    githubUrl: '#',
    demoUrl: '#',
    gradient: 'linear-gradient(135deg, #3498db, #2ecc71)',
  },
  {
    title: 'Urban Planning Tool',
    description:
      'Interactive 3D tool for urban planning and development simulation.',
    technologies: ['Vue.js', 'WebGL', 'Node.js', 'MongoDB'],
    githubUrl: '#',
    demoUrl: '#',
    gradient: 'linear-gradient(135deg, #e74c3c, #f1c40f)',
  },
  {
    title: 'Traffic Flow Simulator',
    description:
      'Advanced traffic simulation with AI-powered flow optimization.',
    technologies: ['React', 'D3.js', 'Python', 'TensorFlow'],
    githubUrl: '#',
    demoUrl: '#',
    gradient: 'linear-gradient(135deg, #9b59b6, #3498db)',
  },
  {
    title: 'Building Information Modeling',
    description:
      '3D BIM solution for architectural visualization and analysis.',
    technologies: ['Angular', 'Three.js', 'TypeScript', 'Express'],
    githubUrl: '#',
    demoUrl: '#',
    gradient: 'linear-gradient(135deg, #2ecc71, #1abc9c)',
  },
];

const Projects: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.projectsContainer}>
        <h1 className={styles.title}>Projects</h1>
        <div className={styles.grid}>
          {projects.map((project, index) => (
            <div
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Projects;
