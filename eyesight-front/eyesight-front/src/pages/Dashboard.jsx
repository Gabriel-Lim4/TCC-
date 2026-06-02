// ─────────────────────────────────────────────────────────────
// pages/Dashboard.jsx
//
// Visão geral: mostra status real das contas vinculadas
// e redireciona para a página certa de cada plataforma.
// ─────────────────────────────────────────────────────────────

import '../styles/Dashboard.css';
import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { FaDollarSign }        from 'react-icons/fa';
import { FiUsers, FiTrendingUp } from 'react-icons/fi';
import { AiOutlineEye }        from 'react-icons/ai';
import api                     from '../services/api';

function Dashboard() {
  const [metaConectado, setMetaConectado] = useState(false);
  const [usuario, setUsuario]             = useState({});
  const navigate                          = useNavigate();

  useEffect(() => {
    // Lê o usuário do localStorage (salvo no login)
    const u = JSON.parse(localStorage.getItem('usuario') || '{}');
    setUsuario(u);

    // Verifica se a conta Meta está conectada para mostrar no painel
    api.get('/meta/status')
      .then(({ data }) => setMetaConectado(data.conectado))
      .catch(() => {}); // falha silenciosa — dashboard não deve quebrar por isso
  }, []);

  function sair() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
  }

  return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Início</h1>
          <p className="subtitle">
            {usuario.nome ? `Olá, ${usuario.nome}! ` : ''}Visão geral das plataformas
          </p>
        </div>
        <button onClick={sair} style={{ fontSize: 12, background: 'transparent', border: '1px solid #ccc', color: '#666', marginTop: 4 }}>
          Sair
        </button>
      </div>

      {/* Cards de métricas globais — zerados até ter dados reais */}
      <div className="cards-top">
        <div className="card">
          <div className="card-header">
            <div className="icon-box"><FaDollarSign /></div>
            <span className="green-text">+0%</span>
          </div>
          <p>Receita Total</p>
          <h2>R$ 0,00</h2>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="icon-box"><FiUsers /></div>
          </div>
          <p>Audiência</p>
          <h2>0</h2>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="icon-box"><AiOutlineEye /></div>
          </div>
          <p>Visualizações</p>
          <h2>0</h2>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="icon-box"><FiTrendingUp /></div>
          </div>
          <p>Conversão</p>
          <h2>0%</h2>
        </div>
      </div>

      <h2 style={{ marginTop: 30 }}>Suas Plataformas</h2>

      <div className="platforms-grid">

        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/app/meta')}>
          <h3>Meta Ads</h3>
          {metaConectado
            ? <p style={{ color: '#38a169' }}>● Conectado</p>
            : <p style={{ color: '#aaa' }}>Clique para conectar</p>
          }
        </div>

        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/app/instagram')}>
          <h3>Instagram</h3>
          {metaConectado
            ? <p style={{ color: '#38a169' }}>● Via Meta Ads</p>
            : <p style={{ color: '#aaa' }}>Conecte o Meta primeiro</p>
          }
        </div>

        <div className="card">
          <h3>TikTok</h3>
          <p style={{ color: '#aaa' }}>Em breve</p>
        </div>

        <div className="card">
          <h3>Google Ads</h3>
          <p style={{ color: '#aaa' }}>Em breve</p>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
