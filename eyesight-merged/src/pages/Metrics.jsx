import "../styles/Metrics.css";
import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import {
  FiDollarSign, FiUsers, FiActivity, FiTarget,
  FiTrendingUp, FiMousePointer, FiPercent, FiBarChart2
} from "react-icons/fi";
import api from "../services/api";

const PERIODOS = [
  { label: 'Hoje',        value: 'today' },
  { label: 'Ontem',       value: 'yesterday' },
  { label: '7 dias',      value: 'last_7d' },
  { label: '30 dias',     value: 'last_30d' },
  { label: '90 dias',     value: 'last_90d' },
];

function Metrics() {
  const [resumo, setResumo]         = useState(null);
  const [campanhas, setCampanhas]   = useState([]);
  const [periodo, setPeriodo]       = useState('last_30d');
  const [conectado, setConectado]   = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    carregar();
  }, [periodo]);

  async function carregar() {
    setLoading(true);
    try {
      const { data: status } = await api.get('/meta/status');
      setConectado(status.conectado);

      if (status.conectado) {
        const [resumoRes, campRes] = await Promise.allSettled([
          api.get(`/meta/insights/resumo?periodo=${periodo}`),
          api.get('/meta/campanhas'),
        ]);
        if (resumoRes.status === 'fulfilled') setResumo(resumoRes.value.data.totais);
        if (campRes.status === 'fulfilled')   setCampanhas(campRes.value.data.campanhas || []);
      }
    } catch {
      // silencia
    } finally {
      setLoading(false);
    }
  }

  const fmt = {
    moeda:  (v) => `R$ ${parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    numero: (v) => parseFloat(v || 0).toLocaleString('pt-BR'),
    pct:    (v) => `${parseFloat(v || 0).toFixed(2)}%`,
  };

  const ativas   = campanhas.filter(c => c.status === 'ACTIVE').length;
  const pausadas = campanhas.filter(c => c.status === 'PAUSED').length;

  // Dados para o gráfico de barras por campanha (simulado com dados do resumo dividido)
  const dadosCampanhas = campanhas.slice(0, 6).map(c => ({
    name: c.name.length > 20 ? c.name.slice(0, 18) + '…' : c.name,
    status: c.status,
  }));

  // Dados para gráfico de linha — evolução dos totais no período
  const dadosLinha = resumo ? [
    { name: 'Impressões', valor: resumo.impressions },
    { name: 'Cliques',    valor: resumo.clicks },
    { name: 'Alcance',    valor: resumo.reach },
  ] : [];

  return (
    <div className="dashboard-content">

      <div className="page-header-title">
        <h1>Métricas</h1>
      </div>
      <p className="subtitle">Visão unificada de performance — Meta Ads</p>

      {/* Filtro de período */}
      <div className="periodo-tabs">
        {PERIODOS.map(p => (
          <button
            key={p.value}
            className={`tab-btn ${periodo === p.value ? 'tab-ativo' : ''}`}
            onClick={() => setPeriodo(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {!conectado && !loading && (
        <p className="empty-text" style={{ marginBottom: 24 }}>
          Conecte o Meta Ads para ver suas métricas reais.
        </p>
      )}

      {/* Cards principais */}
      <div className="metrics-grid">
        <div className="card top-row-card">
          <div className="card-header">
            <div className="icon-box metrics-accent"><FiDollarSign /></div>
          </div>
          <p className="card-title">Investimento Total</p>
          <h2 className="card-value">{resumo ? fmt.moeda(resumo.spend) : 'R$ 0,00'}</h2>
          <span className="month-comparison-text">Meta Ads · {PERIODOS.find(p => p.value === periodo)?.label}</span>
        </div>

        <div className="card top-row-card">
          <div className="card-header">
            <div className="icon-box metrics-accent"><FiUsers /></div>
          </div>
          <p className="card-title">Alcance Total</p>
          <h2 className="card-value">{resumo ? fmt.numero(resumo.reach) : '0'}</h2>
          <span className="month-comparison-text">pessoas únicas atingidas</span>
        </div>

        <div className="card top-row-card">
          <div className="card-header">
            <div className="icon-box metrics-accent"><FiActivity /></div>
          </div>
          <p className="card-title">Impressões</p>
          <h2 className="card-value">{resumo ? fmt.numero(resumo.impressions) : '0'}</h2>
          <span className="month-comparison-text">exibições totais</span>
        </div>

        <div className="card top-row-card">
          <div className="card-header">
            <div className="icon-box metrics-accent"><FiTarget /></div>
          </div>
          <p className="card-title">Campanhas Ativas</p>
          <h2 className="card-value">{ativas}</h2>
          <span className="month-comparison-text">{pausadas} pausadas</span>
        </div>
      </div>

      {/* Métricas de Performance */}
      <h2 className="section-title">Performance</h2>
      <div className="metrics-grid">
        <div className="card">
          <div className="card-header"><div className="icon-box metrics-accent"><FiMousePointer /></div></div>
          <p className="card-title">Cliques</p>
          <h2 className="card-value">{resumo ? fmt.numero(resumo.clicks) : '0'}</h2>
        </div>
        <div className="card">
          <div className="card-header"><div className="icon-box metrics-accent"><FiBarChart2 /></div></div>
          <p className="card-title">CTR Médio</p>
          <h2 className="card-value">{resumo ? fmt.pct(resumo.ctr) : '0%'}</h2>
        </div>
        <div className="card">
          <div className="card-header"><div className="icon-box metrics-accent"><FiPercent /></div></div>
          <p className="card-title">CPM Médio</p>
          <h2 className="card-value">{resumo ? fmt.moeda(resumo.cpm) : 'R$ 0,00'}</h2>
        </div>
        <div className="card">
          <div className="card-header"><div className="icon-box metrics-accent"><FiTrendingUp /></div></div>
          <p className="card-title">CPC Médio</p>
          <h2 className="card-value">
            {resumo && resumo.clicks > 0
              ? fmt.moeda(resumo.spend / resumo.clicks)
              : '—'}
          </h2>
        </div>
      </div>

      {/* Gráfico — distribuição de métricas */}
      {resumo && (
        <>
          <h2 className="section-title">Distribuição de Tráfego</h2>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[
                { name: 'Impressões', valor: resumo.impressions },
                { name: 'Alcance',    valor: resumo.reach },
                { name: 'Cliques',    valor: resumo.clicks },
              ]} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 13 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10 }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#00d2ff' }}
                  formatter={v => v.toLocaleString('pt-BR')}
                />
                <Bar dataKey="valor" fill="#00d2ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Tabela de campanhas */}
      <h2 className="section-title">Campanhas</h2>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Objetivo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {campanhas.length === 0 && (
              <tr>
                <td colSpan={3} style={{ color: '#64748b', textAlign: 'center' }}>
                  {conectado ? 'Nenhuma campanha encontrada.' : 'Meta Ads não conectado.'}
                </td>
              </tr>
            )}
            {campanhas.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td style={{ color: '#64748b' }}>{c.objective || '—'}</td>
                <td>
                  <span className={`campaign-status status-${c.status?.toLowerCase()}`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default Metrics;