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
    title: '3D 城市可视化',
    description: '具有动态建筑和环境效果的交互式3D城市可视化。',
    technologies: ['React', 'Three.js', 'TypeScript', 'GSAP'],
    githubUrl: '#',
    demoUrl: '#',
    gradient: 'linear-gradient(135deg, #3498db, #2ecc71)',
    demoKey: 'city-3d',
  },
  {
    title: '城市交通流量',
    description: '具有交互式车辆和道路网络的实时交通流量模拟。',
    technologies: ['React', 'Three.js', 'TypeScript', 'GSAP'],
    githubUrl: '#',
    demoUrl: '#',
    gradient: 'linear-gradient(135deg, #e74c3c, #f1c40f)',
    demoKey: 'city-car',
  },
];
