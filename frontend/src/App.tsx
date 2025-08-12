import React from 'react';
import { AdminDashboard } from './pages/AdminDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { ParentDashboard } from './pages/ParentDashboard';

export default function App() {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif', padding: 24 }}>
      <h1>Baraem Al-Noor Educational Platform</h1>
      <p>Initial scaffolding. Dashboards will be implemented with full functionality.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h2>Student Dashboard</h2>
          <StudentDashboard />
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h2>Teacher Dashboard</h2>
          <TeacherDashboard />
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h2>Parent Dashboard</h2>
          <ParentDashboard />
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h2>Admin Dashboard</h2>
          <AdminDashboard />
        </div>
      </div>
    </div>
  );
}


