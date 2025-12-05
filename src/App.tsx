import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WorkoutProvider } from './context/WorkoutContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';



function App() {
  return (
    <BrowserRouter>
      <WorkoutProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </Layout>
      </WorkoutProvider>
    </BrowserRouter>
  );
}

export default App;
