import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { PublicOnly, RequireAuth, RequireRole } from './components/Guards';
import { useAuth } from './context/AuthContext';
import Landing from './pages/landing';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import ComplaintsPage from './pages/ComplaintsPage';
import ComplaintDetail from './pages/ComplaintDetail';
import StudentDashboard from './pages/student/StudentDashboard';
import MyRoom from './pages/student/MyRoom';
import NewComplaint from './pages/student/NewComplaint';
import WardenDashboard from './pages/warden/WardenDashboard';
import RoomsPage from './pages/warden/RoomsPage';
import StudentsPage from './pages/warden/StudentsPage';
import StaffPage from './pages/warden/StaffPage';
import ReportsPage from './pages/warden/ReportsPage';
import TechDashboard from './pages/maintenance/TechDashboard';

function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'warden') return <WardenDashboard />;
  if (user?.role === 'maintenance') return <TechDashboard />;
  return <StudentDashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="complaints/new" element={<RequireRole roles={['student']}><NewComplaint /></RequireRole>} />
        <Route path="complaints/:id" element={<ComplaintDetail />} />
        <Route path="my-room" element={<RequireRole roles={['student']}><MyRoom /></RequireRole>} />
        <Route path="rooms" element={<RequireRole roles={['warden']}><RoomsPage /></RequireRole>} />
        <Route path="students" element={<RequireRole roles={['warden']}><StudentsPage /></RequireRole>} />
        <Route path="staff" element={<RequireRole roles={['warden']}><StaffPage /></RequireRole>} />
        <Route path="reports" element={<RequireRole roles={['warden']}><ReportsPage /></RequireRole>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
