import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WorkoutProvider } from './context/WorkoutContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';

import { Auth } from './components/Auth';

function App() {
  return (
    <BrowserRouter>
      <WorkoutProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </Layout>
      </WorkoutProvider>
    </BrowserRouter>
  );
}

export default App;
