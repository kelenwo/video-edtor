import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { Editor } from './pages/Editor';
import { ProjectsProvider } from './context/ProjectsContext';
export function App() {
  return <BrowserRouter>
      <ProjectsProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/editor/:projectId" element={<Editor />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProjectsProvider>
    </BrowserRouter>;
}