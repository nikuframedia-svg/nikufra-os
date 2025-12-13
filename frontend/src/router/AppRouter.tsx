import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WorkCentersListPage from '../pages/WorkCentersListPage';
import WorkCenterDetailsPage from '../pages/WorkCenterDetailsPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/work-centers" replace />} />
        <Route path="/work-centers" element={<WorkCentersListPage />} />
        <Route path="/work-centers/:id" element={<WorkCenterDetailsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

