interface Project {
  title: string;
  description: string;
  technologies: string[];
  githubUrl: string;
  demoUrl: string;
  gradient: string;
  demoKey: string;
}

export const projects: Project[] = [
  {
    title: 'Smart City Dashboard',
    description:
      'Real-time monitoring and visualization of city infrastructure and services.',
    technologies: ['React', 'Three.js', 'WebGL', 'TypeScript'],
    githubUrl: '#',
    demoUrl: '#',
    gradient: 'linear-gradient(135deg, #3498db, #2ecc71)',
    demoKey: 'smart-city',
  },
  {
    title: 'Urban Planning Tool',
    description:
      'Interactive 3D tool for urban planning and development simulation.',
    technologies: ['Vue.js', 'WebGL', 'Node.js', 'MongoDB'],
    githubUrl: '#',
    demoUrl: '#',
    gradient: 'linear-gradient(135deg, #e74c3c, #f1c40f)',
    demoKey: 'urban-planning',
  },
  {
    title: 'Traffic Flow Simulator',
    description:
      'Advanced traffic simulation with AI-powered flow optimization.',
    technologies: ['React', 'D3.js', 'Python', 'TensorFlow'],
    githubUrl: '#',
    demoUrl: '#',
    gradient: 'linear-gradient(135deg, #9b59b6, #3498db)',
    demoKey: 'traffic-flow',
  },
  {
    title: 'Building Information Modeling',
    description:
      '3D BIM solution for architectural visualization and analysis.',
    technologies: ['Angular', 'Three.js', 'TypeScript', 'Express'],
    githubUrl: '#',
    demoUrl: '#',
    gradient: 'linear-gradient(135deg, #2ecc71, #1abc9c)',
    demoKey: 'building-info',
  },
];
