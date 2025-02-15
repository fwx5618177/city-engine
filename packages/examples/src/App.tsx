import React from 'react';
import { Route, HashRouter as Router, Routes } from 'react-router-dom';

import { Layout } from '@/components/Layout';
import { ThemeProvider } from '@/context/ThemeContext';
import Home from '@/pages/Home';
import ProjectDetails from '@/pages/ProjectDetails';
import Projects from '@/pages/Projects';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
};

export default App;
