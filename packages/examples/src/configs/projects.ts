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
  {
    title: 'WebGIS 城市数据展示',
    description:
      '基于 Cesium 的三维城市数据可视化与分析平台，支持 3D Tiles 数据展示、空间分析等功能。',
    technologies: ['React', 'Cesium', 'TypeScript', '3DCityDB'],
    githubUrl: 'https://github.com/3dcitydb/3dcitydb-web-map',
    demoUrl: 'https://www.3dcitydb.org/3dcitydb-web-map/1.9.1/3dwebclient/',
    gradient: 'linear-gradient(135deg, #16a085, #2980b9)',
    demoKey: 'city-gis',
  },
];
