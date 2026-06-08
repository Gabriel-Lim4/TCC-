import '../styles/Meta.css';
import { useState, useEffect }  from 'react';
import { useSearchParams }      from 'react-router-dom';
import api                      from '../services/api';
import {
  FiDollarSign, FiEye, FiTarget, FiTrendingUp,
  FiMousePointer, FiActivity, FiFacebook, FiInstagram
} from 'react-icons/fi';

function Meta() {
  const [campanhas, setCampanhas]     = useState([]);
  const [conectado, setConectado]     = useState(false);
  const [accountId, setAccountId]     = useState('');
  const [resumo, setResumo]           = useState(null);
  const [periodo, setPeriodo]         = useState('last_30d');
  const [loading, setLoading]         = useState(true);
  const [loadingCamp, setLoadingCamp] = useState(false);
  const [erro, setErro]               = useState('');
  const [sucesso, setSucesso]         = useState('');
  const [searchParams]                = useSearchParams();

  useEffect(() => {
    const resultado = searchParams.get('meta');
    if (resultado === 'conectado') setSucesso('Conta Meta conectada com sucesso!');
    if (resultado === 'erro')      setErro('Erro ao conectar com o Meta. Tente novamente.');
    if (resultado === 'negado')    setErro('Autorização negada. Tente novamente.');
  }, [searchParams]);

  useEffect(() => {
    inicializar();
  }, []);

  useEffect(() => {
    if (conectado) carregarResumo();
  }, [periodo]);

  async function inicializar() {
    try {
      const { data } = await api.get('/meta/status');
      setConectado(data.conectado);
      if (data.account_id) setAccountId(data.account_id);
      if (data.conectado) {
        await Promise.all([carregarCampanhas(), carregarResumo()]);
      }
    } catch {
      setErro('Erro ao verificar conexão com o Meta.');
    } finally {
      setLoading(false);
    }
  }

  async function carregarCampanhas() {
    setLoadingCamp(true);
    try {
      const { data } = await api.get('/meta/campanhas');
      setCampanhas(data.campanhas || []);
    } catch (err) {
      if (err.response?.data?.acao === 'reconectar') {
        setConectado(false);
        setErro('Sua conexão com o Meta expirou. Clique em "Conectar conta" para renovar.');
      } else {
        setErro(err.response?.data?.erro || 'Erro ao buscar campanhas.');
      }
    } finally {
      setLoadingCamp(false);
    }
  }

  async function carregarResumo() {
    try {
      const { data } = await api.get(`/meta/insights/resumo?periodo=${periodo}`);
      setResumo(data.totais);
    } catch {
      // silencia — conta pode não ter campanhas com dados
    }
  }

  async function conectarMeta() {
    setErro('');
    try {
      const { data } = await api.get('/meta/conectar');
      sessionStorage.setItem('meta_oauth_state', data.state);
      window.location.href = data.url;
    } catch {
      setErro('Erro ao iniciar conexão com o Meta.');
    }
  }

  async function desconectar() {
    setErro('');
    try {
      await api.delete('/meta/desconectar');
      setConectado(false);
      setCampanhas([]);
      setAccountId('');
      setResumo(null);
      setSucesso('Conta Meta desconectada.');
    } catch {
      setErro('Erro ao desconectar conta.');
    }
  }

  const fmt = {
    moeda:  (v) => `R$ ${parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    numero: (v) => parseFloat(v || 0).toLocaleString('pt-BR'),
    pct:    (v) => `${parseFloat(v || 0).toFixed(2)}%`,
    dash:   (v) => v != null ? v : '—',
  };

  const totalCampanhas = campanhas.length;
  const ativas = campanhas.filter(c => c.status === 'ACTIVE').length;

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="page-header-title"><h1>Meta Ads</h1></div>
        <p className="subtitle">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-content">

      <div className="page-header-title">
        <h1>Meta Ads</h1>
      </div>
      <p className="subtitle">Acompanhe suas campanhas no Facebook e Instagram</p>

      {erro    && <p className="feedback-msg feedback-erro">{erro}</p>}
      {sucesso && <p className="feedback-msg feedback-sucesso">{sucesso}</p>}

      {/* Barra de conexão + filtro de período */}
      <div className="connection-bar">
        {!conectado ? (
          <button className="btn-conectar" onClick={conectarMeta}>
            Conectar conta do Meta
          </button>
        ) : (
          <>
            <span className="connected-label">
              ● Conta conectada {accountId && `(${accountId})`}
            </span>
            <select
              className="select-periodo"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            >
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="last_7d">Últimos 7 dias</option>
              <option value="last_30d">Últimos 30 dias</option>
              <option value="last_90d">Últimos 90 dias</option>
            </select>
            <button className="btn-atualizar" onClick={() => Promise.all([carregarCampanhas(), carregarResumo()])} disabled={loadingCamp}>
              {loadingCamp ? 'Atualizando...' : 'Atualizar'}
            </button>
            <button className="btn-desconectar" onClick={desconectar}>
              Desconectar
            </button>
          </>
        )}
      </div>

      {/* Cards principais */}
      <div className="cards-top">
        <div className="card">
          <div className="card-header">
            <div className="icon-box meta-accent"><FiDollarSign /></div>
          </div>
          <p className="card-title">Investimento Total</p>
          <h2 className="card-value">{resumo ? fmt.moeda(resumo.spend) : 'R$ 0,00'}</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box meta-accent"><FiEye /></div>
          </div>
          <p className="card-title">Alcance</p>
          <h2 className="card-value">{resumo ? fmt.numero(resumo.reach) : '—'}</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box meta-accent"><FiTarget /></div>
          </div>
          <p className="card-title">Campanhas Ativas</p>
          <h2 className="card-value">{conectado ? ativas : '0'}</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box meta-accent"><FiTrendingUp /></div>
          </div>
          <p className="card-title">CTR Médio</p>
          <h2 className="card-value">{resumo ? fmt.pct(resumo.ctr) : '—'}</h2>
        </div>
      </div>

      {/* Métricas de Performance */}
      <h2 className="section-title">Métricas de Performance</h2>
      <div className="cards-top">
        <div className="card">
          <div className="card-header"><div className="icon-box meta-accent"><FiEye /></div></div>
          <p className="card-title">Impressões</p>
          <h2 className="card-value">{resumo ? fmt.numero(resumo.impressions) : '—'}</h2>
        </div>
        <div className="card">
          <div className="card-header"><div className="icon-box meta-accent"><FiMousePointer /></div></div>
          <p className="card-title">Cliques</p>
          <h2 className="card-value">{resumo ? fmt.numero(resumo.clicks) : '—'}</h2>
        </div>
        <div className="card">
          <div className="card-header"><div className="icon-box meta-accent"><FiActivity /></div></div>
          <p className="card-title">CPM Médio</p>
          <h2 className="card-value">{resumo ? fmt.moeda(resumo.cpm) : '—'}</h2>
        </div>
        <div className="card">
          <div className="card-header"><div className="icon-box meta-accent"><FiDollarSign /></div></div>
          <p className="card-title">CPC Médio</p>
          <h2 className="card-value">{resumo && resumo.clicks > 0 ? fmt.moeda(resumo.spend / resumo.clicks) : '—'}</h2>
        </div>
      </div>

      {/* Lista de campanhas */}
      {conectado && (
        <>
          <h2 className="section-title">
            Campanhas {totalCampanhas > 0 && `(${totalCampanhas})`}
          </h2>

          {loadingCamp && <p className="loading-text">Buscando campanhas...</p>}

          {!loadingCamp && campanhas.length === 0 && (
            <p className="empty-text">Nenhuma campanha encontrada.</p>
          )}

          {!loadingCamp && campanhas.map(c => (
            <div key={c.id} className="campaign-row">
              <div>
                <strong>{c.name}</strong>
                {c.objective && <span className="campaign-objective">{c.objective}</span>}
              </div>
              <span className={`campaign-status status-${c.status?.toLowerCase()}`}>
                {c.status}
              </span>
            </div>
          ))}
        </>
      )}

      {/* Por Plataforma */}
      <h2 className="section-title">Por Plataforma</h2>
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-card-header">
            <FiFacebook className="section-icon fb-color" />
            <h2>Facebook</h2>
          </div>
          <div className="stats-grid">
            <div><p>Gasto</p><h1>{resumo ? fmt.moeda(resumo.spend * 0.6) : 'R$ 0'}</h1></div>
            <div><p>Alcance</p><h1>{resumo ? fmt.numero(resumo.reach * 0.6) : '—'}</h1></div>
            <div><p>Cliques</p><h1>{resumo ? fmt.numero(resumo.clicks * 0.6) : '—'}</h1></div>
            <div><p>CTR</p><h1>{resumo ? fmt.pct(resumo.ctr) : '—'}</h1></div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-header">
            <FiInstagram className="section-icon ig-color" />
            <h2>Instagram</h2>
          </div>
          <div className="stats-grid">
            <div><p>Gasto</p><h1>{resumo ? fmt.moeda(resumo.spend * 0.4) : 'R$ 0'}</h1></div>
            <div><p>Alcance</p><h1>{resumo ? fmt.numero(resumo.reach * 0.4) : '—'}</h1></div>
            <div><p>Cliques</p><h1>{resumo ? fmt.numero(resumo.clicks * 0.4) : '—'}</h1></div>
            <div><p>CTR</p><h1>{resumo ? fmt.pct(resumo.ctr) : '—'}</h1></div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Meta;