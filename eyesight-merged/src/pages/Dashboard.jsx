import "../styles/Dashboard.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaDollarSign, FaTiktok } from "react-icons/fa";
import { SiMeta } from "react-icons/si";
import { FiUsers, FiTrendingUp, FiInstagram, FiAlertCircle } from "react-icons/fi";
import { AiOutlineEye, AiOutlineGlobal } from "react-icons/ai";
import api from "../services/api";

function Dashboard() {
  const [resumoMeta, setResumoMeta]     = useState(null);
  const [campanhas, setCampanhas]       = useState([]);
  const [metaConectado, setMetaConectado] = useState(false);
  const [usuario, setUsuario]           = useState({});
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem('usuario');
    if (cached) setUsuario(JSON.parse(cached));

    async function carregar() {
      try {
        // Verifica conexão Meta
        const { data: statusData } = await api.get('/meta/status');
        setMetaConectado(statusData.conectado);

        if (statusData.conectado) {
          const [resumoRes, campRes] = await Promise.allSettled([
            api.get('/meta/insights/resumo?periodo=last_30d'),
            api.get('/meta/campanhas'),
          ]);
          if (resumoRes.status === 'fulfilled') setResumoMeta(resumoRes.value.data.totais);
          if (campRes.status === 'fulfilled')   setCampanhas(campRes.value.data.campanhas || []);
        }
      } catch {
        // silencia — dashboard mostra estado vazio
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  const fmt = {
    moeda:  (v) => `R$ ${parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    numero: (v) => parseFloat(v || 0).toLocaleString('pt-BR'),
    pct:    (v) => `${parseFloat(v || 0).toFixed(2)}%`,
  };

  const ativas = campanhas.filter(c => c.status === 'ACTIVE').length;
  const nome   = usuario.nome?.split(' ')[0] || 'usuário';

  return (
    <div className="dashboard-content">

      <div className="page-header-title">
        <h1>Olá, {nome} </h1>
      </div>
      <p className="subtitle">Visão geral das suas plataformas — últimos 30 dias</p>

      {/* Aviso se Meta não conectado */}
      {!loading && !metaConectado && (
        <div className="alert-banner">
          <FiAlertCircle />
          <span>Nenhuma plataforma conectada. <Link to="/app/meta">Conecte o Meta Ads</Link> para ver seus dados.</span>
        </div>
      )}

      {/* Cards principais */}
      <div className="cards-top">
        <div className="card">
          <div className="card-header">
            <div className="icon-box"><FaDollarSign /></div>
            <span className={resumoMeta?.spend > 0 ? "green-text" : "muted-text"}>
              {resumoMeta ? fmt.moeda(resumoMeta.spend) : 'R$ 0,00'}
            </span>
          </div>
          <p className="card-title">Investimento Total</p>
          <h2 className="card-value">{resumoMeta ? fmt.moeda(resumoMeta.spend) : 'R$ 0,00'}</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box"><FiUsers /></div>
            <span className="green-text">{resumoMeta ? fmt.numero(resumoMeta.reach) : '0'}</span>
          </div>
          <p className="card-title">Alcance Total</p>
          <h2 className="card-value">{resumoMeta ? fmt.numero(resumoMeta.reach) : '0'}</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box"><AiOutlineEye /></div>
            <span className="green-text">{resumoMeta ? fmt.numero(resumoMeta.impressions) : '0'}</span>
          </div>
          <p className="card-title">Impressões</p>
          <h2 className="card-value">{resumoMeta ? fmt.numero(resumoMeta.impressions) : '0'}</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box"><FiTrendingUp /></div>
            <span className="green-text">{resumoMeta ? fmt.pct(resumoMeta.ctr) : '0%'}</span>
          </div>
          <p className="card-title">CTR Médio</p>
          <h2 className="card-value">{resumoMeta ? fmt.pct(resumoMeta.ctr) : '0%'}</h2>
        </div>
      </div>

      {/* Plataformas */}
      <h2 className="section-title">Suas Plataformas</h2>
      <div className="platforms-grid">

        <Link to="/app/meta" className="card platform-card">
          <div className="card-platform-header">
            <div className="icon-box icon-meta"><SiMeta /></div>
            <h3>Meta Ads</h3>
            <span className={`platform-badge ${metaConectado ? 'badge-conectado' : 'badge-desconectado'}`}>
              {metaConectado ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <div className="platform-stats">
            <div><p>Campanhas ativas</p><strong>{ativas}</strong></div>
            <div><p>Investido</p><strong>{resumoMeta ? fmt.moeda(resumoMeta.spend) : '—'}</strong></div>
            <div><p>Cliques</p><strong>{resumoMeta ? fmt.numero(resumoMeta.clicks) : '—'}</strong></div>
          </div>
        </Link>

        <Link to="/app/tiktok" className="card platform-card">
          <div className="card-platform-header">
            <div className="icon-box icon-tiktok"><FaTiktok /></div>
            <h3>TikTok</h3>
            <span className="platform-badge badge-desconectado">Em breve</span>
          </div>
          <div className="platform-stats">
            <div><p>Campanhas</p><strong>—</strong></div>
            <div><p>Investido</p><strong>—</strong></div>
            <div><p>Cliques</p><strong>—</strong></div>
          </div>
        </Link>

        <Link to="/app/instagram" className="card platform-card">
          <div className="card-platform-header">
            <div className="icon-box icon-instagram"><FiInstagram /></div>
            <h3>Instagram</h3>
            <span className="platform-badge badge-desconectado">Em breve</span>
          </div>
          <div className="platform-stats">
            <div><p>Seguidores</p><strong>—</strong></div>
            <div><p>Alcance</p><strong>—</strong></div>
            <div><p>Engajamento</p><strong>—</strong></div>
          </div>
        </Link>

        <Link to="/app/google" className="card platform-card">
          <div className="card-platform-header">
            <div className="icon-box icon-google"><AiOutlineGlobal /></div>
            <h3>Google Ads</h3>
            <span className="platform-badge badge-desconectado">Em breve</span>
          </div>
          <div className="platform-stats">
            <div><p>Campanhas</p><strong>—</strong></div>
            <div><p>Investido</p><strong>—</strong></div>
            <div><p>Cliques</p><strong>—</strong></div>
          </div>
        </Link>

      </div>
    </div>
  );
}

export default Dashboard;