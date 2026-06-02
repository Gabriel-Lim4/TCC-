// ─────────────────────────────────────────────────────────────
// App.jsx — definição de todas as rotas do projeto
//
// Rotas públicas (sem token):
//   /         → Login (também faz cadastro)
//   /cadastro → Cadastro (mantido por compatibilidade)
//
// Rotas protegidas (exigem JWT):
//   /app/*    → envolvidas pelo RotaProtegida
//              Se não tiver token, redireciona para "/"
// ─────────────────────────────────────────────────────────────

import { Routes, Route } from 'react-router-dom';
import RotaProtegida     from './components/RotaProtegida';

import Layout    from './pages/Layout';
import Login     from './pages/Login';
import Cadastro  from './pages/Cadastro';
import Dashboard from './pages/Dashboard';
import Meta      from './pages/Meta';
import Instagram from './pages/Instagram';
import TikTok    from './pages/Tiktok';
import Google    from './pages/Google';
import Metrics   from './pages/Metrics';
import Accounts  from './pages/Accounts';
import Assistant from './pages/Assistant';

function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/"         element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      {/* Protegidas — RotaProtegida verifica o token antes de renderizar */}
      <Route
        path="/app"
        element={
          <RotaProtegida>
            <Layout />
          </RotaProtegida>
        }
      >
        <Route index           element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="meta"      element={<Meta />} />
        <Route path="instagram" element={<Instagram />} />
        <Route path="tiktok"    element={<TikTok />} />
        <Route path="google"    element={<Google />} />
        <Route path="metrics"   element={<Metrics />} />
        <Route path="accounts"  element={<Accounts />} />
        <Route path="assistant" element={<Assistant />} />
      </Route>
    </Routes>
  );
}

export default App;
