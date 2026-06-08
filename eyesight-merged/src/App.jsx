import { Routes, Route } from 'react-router-dom';
import RotaProtegida     from './components/RotaProtegida';

import Home      from './pages/Home';
import Layout    from './pages/Layout';
import Login     from './pages/Login';
import Cadastro  from './pages/Cadastro';
import Dashboard from './pages/Dashboard';
import Meta      from './pages/Meta';
import Instagram from './pages/Instagram';
import TikTok    from './pages/Tiktok';
import Google    from './pages/Google';
import Metrics   from './pages/Metrics';
import Account   from './pages/Account';
import Assistant from './pages/Assistant';
import Tools     from './pages/Tools';
import Profile   from './pages/Profile';

function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/"         element={<Home />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      {/* Protegidas */}
      <Route
        path="/app"
        element={
          <RotaProtegida>
            <Layout />
          </RotaProtegida>
        }
      >
        <Route index             element={<Dashboard />} />
        <Route path="dashboard"  element={<Dashboard />} />
        <Route path="meta"       element={<Meta />} />
        <Route path="instagram"  element={<Instagram />} />
        <Route path="tiktok"     element={<TikTok />} />
        <Route path="google"     element={<Google />} />
        <Route path="metrics"    element={<Metrics />} />
        <Route path="account"    element={<Account />} />
        <Route path="assistant"  element={<Assistant />} />
        <Route path="tools"      element={<Tools />} />
        <Route path="profile"    element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
