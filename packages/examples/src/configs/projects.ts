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
    title: '3D City Visualization',
    description:
      'Interactive 3D city visualization with dynamic buildings and environment effects.',
    technologies: ['React', 'Three.js', 'TypeScript', 'GSAP'],
    githubUrl: '#',
    demoUrl: '#',
    gradient: 'linear-gradient(135deg, #3498db, #2ecc71)',
    demoKey: 'city-3d',
  },
  {
    title: 'Urban Traffic Flow',
    description:
      'Real-time traffic flow simulation with interactive vehicles and road networks.',
    technologies: ['React', 'Three.js', 'TypeScript', 'GSAP'],
    githubUrl: '#',
    demoUrl: '#',
    gradient: 'linear-gradient(135deg, #e74c3c, #f1c40f)',
    demoKey: 'city-car',
  },
];
