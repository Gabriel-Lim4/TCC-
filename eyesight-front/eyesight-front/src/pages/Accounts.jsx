// ─────────────────────────────────────────────────────────────
// pages/Accounts.jsx
//
// Exibe as contas vinculadas do usuário logado.
// Busca o status de cada plataforma no back-end e mostra
// se está conectada ou não, com botão de ação correspondente.
//
// Por que buscar do back-end e não do localStorage?
// O token pode ter expirado, o usuário pode ter desconectado
// em outro dispositivo. O back-end é a fonte da verdade.
// ─────────────────────────────────────────────────────────────

import '../styles/Accounts.css';
import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import api                     from '../services/api';

function Accounts() {
  const [metaStatus, setMetaStatus] = useState(null); // null = carregando
  const [loading, setLoading]       = useState(true);
  const [erro, setErro]             = useState('');
  const navigate                    = useNavigate();

  // Verifica status de cada plataforma ao carregar
  useEffect(() => {
    async function carregarStatus() {
      try {
        const { data } = await api.get('/meta/status');
        setMetaStatus(data);
      } catch (err) {
        setErro('Erro ao carregar contas. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
    carregarStatus();
  }, []);

  async function desconectarMeta() {
    try {
      await api.delete('/meta/desconectar');
      setMetaStatus({ conectado: false });
    } catch (err) {
      setErro('Erro ao desconectar conta Meta.');
    }
  }

  return (
    <div className="dashboard-content">
      <h1>Contas</h1>
      <p className="subtitle">
        Gerencie todas as suas contas conectadas e adicione novas plataformas
      </p>

      {erro && <p style={{ color: 'red', marginBottom: 16 }}>{erro}</p>}

      <h2 style={{ marginTop: 30 }}>Contas Conectadas</h2>

      <div className="platforms-grid">

        {/* Meta Ads */}
        <div className="card">
          <h3>Meta Ads</h3>
          {loading ? (
            <p>Verificando...</p>
          ) : metaStatus?.conectado ? (
            <>
              <p style={{ color: '#38a169' }}>● Conectado</p>
              {metaStatus.account_id && (
                <p style={{ fontSize: 12, color: '#888' }}>{metaStatus.account_id}</p>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => navigate('/app/meta')} style={{ fontSize: 12 }}>
                  Ver campanhas
                </button>
                <button onClick={desconectarMeta} style={{ fontSize: 12, background: 'transparent', color: '#e53e3e', border: '1px solid #e53e3e' }}>
                  Desconectar
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={{ color: '#888' }}>Não conectado</p>
              <button onClick={() => navigate('/app/meta')} style={{ marginTop: 10, fontSize: 12 }}>
                Conectar
              </button>
            </>
          )}
        </div>

        {/* TikTok — placeholder */}
        <div className="card">
          <h3>TikTok</h3>
          <p style={{ color: '#888' }}>Em breve</p>
        </div>

        {/* Instagram — via Meta */}
        <div className="card">
          <h3>Instagram</h3>
          {metaStatus?.conectado ? (
            <p style={{ color: '#38a169' }}>● Via Meta Ads</p>
          ) : (
            <p style={{ color: '#888' }}>Conecte o Meta Ads para acessar</p>
          )}
        </div>

        {/* Google Ads — placeholder */}
        <div className="card">
          <h3>Google Ads</h3>
          <p style={{ color: '#888' }}>Em breve</p>
        </div>

      </div>
    </div>
  );
}

export default Accounts;
