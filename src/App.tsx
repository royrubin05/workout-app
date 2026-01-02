import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';
import { AdminPage } from './pages/Admin';
import { Login } from './pages/Login';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { connectionStatus } = useWorkout();
  const location = useLocation();

  if (connectionStatus === 'disconnected') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If checking, show nothing (or loader) until resolved
  if (connectionStatus === 'checking') {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Checking Session...</div>;
  }

  return children;
};

// Public Route Wrapper (redirects to Home if already logged in)
const PublicRoute = ({ children }: { children: React.ReactElement }) => {
  const { connectionStatus } = useWorkout();

  if (connectionStatus === 'connected') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <WorkoutProvider>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Layout>
                <AdminPage />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </WorkoutProvider>
    </BrowserRouter>
  );
}

export default App;
