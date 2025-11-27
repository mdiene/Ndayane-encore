import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Owners } from './components/Owners';
import { Trucks } from './components/Trucks';
import { Drivers } from './components/Drivers';
import { Deliveries } from './components/Deliveries';
import { Settings } from './components/Settings';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="owners" element={<Owners />} />
          <Route path="trucks" element={<Trucks />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="deliveries" element={<Deliveries />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;