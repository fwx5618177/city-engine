import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { Layout } from '@/components/Layout';
import { ThemeProvider } from '@/context/ThemeContext';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Demo from '@/pages/Demo';
import Documentation from '@/pages/Documentation';
import Features from '@/pages/Features';
import Gallery from '@/pages/Gallery';
import Home from '@/pages/Home';
import Projects from '@/pages/Projects';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/features" element={<Features />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/demo" element={<Demo />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
};

export default App;
