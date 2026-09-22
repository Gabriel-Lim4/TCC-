/* importando o css da tela */
import "../styles/Metrics.css";
import "../styles/variables.css";

import {
  FiDollarSign, FiUsers, FiActivity, FiTarget,
  FiHeart, FiMessageSquare, FiShare2,
  FiMousePointer, FiPercent, FiRadio
} from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi";
import { FaTiktok, FaInstagram, FaGoogle, FaFacebook } from "react-icons/fa";

import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  FunnelChart, Funnel, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";

/* ---------- dados de demonstração ---------- */

const receitaData = [
  { mes: "Mar", receita: 8200, meta: 9000 },
  { mes: "Abr", receita: 9600, meta: 10000 },
  { mes: "Mai", receita: 11400, meta: 11000 },
  { mes: "Jun", receita: 14100, meta: 12500 },
  { mes: "Jul", receita: 16800, meta: 15000 },
  { mes: "Ago", receita: 19500, meta: 17500 },
];

const alcancePorPlataforma = [
  { nome: "TikTok", alcance: 31200, cor: "var(--tiktok)" },
  { nome: "Instagram", alcance: 24500, cor: "var(--instagram)" },
  { nome: "Google Ads", alcance: 18700, cor: "var(--google)" },
  { nome: "Meta Ads", alcance: 15300, cor: "var(--meta)" },
];

const perfilDesempenho = [
  { eixo: "Alcance", conta: 82, mercado: 60 },
  { eixo: "Engajamento", conta: 74, mercado: 55 },
  { eixo: "Conversão", conta: 61, mercado: 58 },
  { eixo: "ROI", conta: 88, mercado: 62 },
  { eixo: "Retenção", conta: 68, mercado: 64 },
];

const funilConversao = [
  { name: "Impressões", value: 128000, fill: "#3b82f6" },
  { name: "Cliques", value: 9600, fill: "#6d8ff8" },
  { name: "Leads", value: 2100, fill: "#8b5cf6" },
  { name: "Conversões", value: 480, fill: "#c4b5fd" },
];

const comparacaoPlataformas = [
  { nome: "TikTok", icone: FaTiktok, cor: "var(--tiktok)", seguidores: "31,2K", engajamento: 9.2, receita: "R$ 6.400", roi: 78 },
  { nome: "Instagram", icone: FaInstagram, cor: "var(--instagram)", seguidores: "24,5K", engajamento: 7.4, receita: "R$ 5.100", roi: 71 },
  { nome: "Google Ads", icone: FaGoogle, cor: "var(--google)", seguidores: "18,7K", engajamento: 4.1, receita: "R$ 5.800", roi: 66 },
  { nome: "Meta Ads", icone: FaFacebook, cor: "var(--meta)", seguidores: "15,3K", engajamento: 5.6, receita: "R$ 2.200", roi: 59 },
];

/* tooltip compacto e consistente, reaproveitado pelos gráficos de área/barra */
const ChartTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="metrics-tooltip">
        <span className="metrics-tooltip-label">{label}</span>
        {payload.map((item) => (
          <span key={item.dataKey} className="metrics-tooltip-value" style={{ color: item.color || item.fill }}>
            {item.name}: {prefix}{item.value.toLocaleString("pt-BR")}{suffix}
          </span>
        ))}
      </div>
    );
  }
  return null;
};

function Metrics() {
  return (
    <div className="dashboard-content">
      <div className="metrics-bg-mesh" aria-hidden="true" />

      <div className="metrics-header-row">
        <div className="page-header-title">
          <span className="metrics-eyebrow">
            <HiOutlineSparkles /> Central de Métricas
          </span>
          <h1>Métricas</h1>
          <p className="subtitle">Visão unificada de todas as suas métricas de performance</p>
        </div>

        <span className="metrics-live-pill">
          <FiRadio className="metrics-live-dot" /> Atualizado agora
        </span>
      </div>

      {/* KPIs do topo: um destaque + indicadores compactos */}
      <div className="metrics-kpi-row">
        <div className="card metrics-kpi-highlight">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiDollarSign />
            </div>
            <span className="green-text">+16%</span>
          </div>
          <p className="card-title">Receita Total</p>
          <h2 className="card-value mono-num">R$ 19.500</h2>
          <div className="metrics-kpi-chart">
            <ResponsiveContainer width="100%" height={44}>
              <AreaChart data={receitaData}>
                <defs>
                  <linearGradient id="kpiReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="receita" stroke="#3b82f6" strokeWidth={2} fill="url(#kpiReceita)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <span className="month-comparison-text">vs. R$ 16.800 no mês anterior</span>
        </div>

        <div className="metrics-kpi-mini-stack">
          <div className="metrics-kpi-mini">
            <FiUsers />
            <div>
              <p>Audiência Total</p>
              <strong className="mono-num">89,7K</strong>
              <span className="month-comparison-text green-text">+9%</span>
            </div>
          </div>
          <div className="metrics-kpi-mini">
            <FiActivity />
            <div>
              <p>Engajamento</p>
              <strong className="mono-num">7.8%</strong>
              <span className="month-comparison-text green-text">+1.2pp</span>
            </div>
          </div>
        </div>

        <div className="metrics-kpi-mini-stack">
          <div className="metrics-kpi-mini">
            <FiTarget />
            <div>
              <p>Conversões</p>
              <strong className="mono-num">480</strong>
              <span className="month-comparison-text green-text">+22%</span>
            </div>
          </div>
          <div className="metrics-kpi-mini">
            <FiPercent />
            <div>
              <p>ROI Geral</p>
              <strong className="mono-num">3.4x</strong>
              <span className="month-comparison-text green-text">+0.4x</span>
            </div>
          </div>
        </div>
      </div>

      {/* RECEITA AO LONGO DO TEMPO — gráfico principal */}
      <div className="metrics-section-header">
        <h2 className="section-title">Receita ao Longo do Tempo</h2>
        <span className="dash-period-tag">Últimos 6 meses</span>
      </div>

      <div className="chart-card metrics-revenue-card">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={receitaData}>
            <defs>
              <linearGradient id="receitaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} width={44}
              tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip content={<ChartTooltip prefix="R$ " />} cursor={{ stroke: "#334155", strokeDasharray: "4 4" }} />
            <Area type="monotone" dataKey="meta" name="Meta" stroke="#475569" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
            <Area type="monotone" dataKey="receita" name="Receita" stroke="#3b82f6" strokeWidth={3} fill="url(#receitaFill)"
              activeDot={{ r: 5, fill: "#3b82f6", stroke: "#0f172a", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="metrics-chart-legend">
          <span><i style={{ background: "#3b82f6" }} /> Receita realizada</span>
          <span><i className="metrics-legend-dash" /> Meta do mês</span>
        </div>
      </div>

      {/* COMPARAÇÃO POR PLATAFORMA + PERFIL DE DESEMPENHO */}
      <div className="metrics-section-header">
        <h2 className="section-title">Comparação por Plataforma</h2>
      </div>

      <div className="metrics-compare-grid">
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <span className="chart-eyebrow">Alcance</span>
              <h3>Alcance por Plataforma</h3>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={alcancePorPlataforma} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke="#1e293b" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }}
                tickFormatter={(v) => `${v / 1000}k`} />
              <YAxis type="category" dataKey="nome" axisLine={false} tickLine={false}
                tick={{ fill: "#cbd5e1", fontSize: 13 }} width={82} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="alcance" name="Alcance" radius={[0, 8, 8, 0]} barSize={22}>
                {alcancePorPlataforma.map((entry, index) => (
                  <Cell key={index} fill={entry.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <span className="chart-eyebrow">Benchmark</span>
              <h3>Perfil de Desempenho</h3>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={perfilDesempenho} outerRadius="72%">
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="eixo" tick={{ fill: "#94a3b8", fontSize: 11.5 }} />
              <Radar name="Sua conta" dataKey="conta" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.35} strokeWidth={2} />
              <Radar name="Benchmark do setor" dataKey="mercado" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.12} strokeWidth={2} strokeDasharray="4 3" />
              <Tooltip content={<ChartTooltip suffix="/100" />} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="metrics-chart-legend">
            <span><i style={{ background: "#3b82f6" }} /> Sua conta</span>
            <span><i style={{ background: "#8b5cf6" }} /> Benchmark do setor</span>
          </div>
        </div>
      </div>

      {/* FUNIL DE CONVERSÃO + ENGAJAMENTO */}
      <div className="metrics-section-header">
        <h2 className="section-title">Funil de Conversão &amp; Engajamento</h2>
      </div>

      <div className="metrics-funnel-grid">
        <div className="chart-card metrics-funnel-card">
          <div className="chart-card-header">
            <div>
              <span className="chart-eyebrow">Jornada</span>
              <h3>Do Impacto à Conversão</h3>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <FunnelChart>
              <Tooltip content={<ChartTooltip />} />
              <Funnel dataKey="value" data={funilConversao} isAnimationActive>
                <LabelList position="right" dataKey="name" fill="#cbd5e1" stroke="none" fontSize={13} />
                <LabelList position="left" dataKey="value" fill="#64748b" stroke="none" fontSize={12}
                  formatter={(v) => v.toLocaleString("pt-BR")} />
                {funilConversao.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
          <span className="metrics-funnel-rate">0,37% de taxa de conversão ponta a ponta</span>
        </div>

        <div className="card metrics-ring-card">
          <div className="metrics-ring">
            <svg viewBox="0 0 120 120" className="metrics-ring-svg">
              <circle cx="60" cy="60" r="52" className="metrics-ring-track" />
              <circle cx="60" cy="60" r="52" className="metrics-ring-progress"
                style={{ strokeDasharray: 2 * Math.PI * 52, strokeDashoffset: 2 * Math.PI * 52 * (1 - 0.78) }} />
            </svg>
            <div className="metrics-ring-inner">
              <FiActivity />
              <strong className="mono-num">7.8%</strong>
            </div>
          </div>
          <p className="card-title">Taxa de Engajamento</p>

          <div className="metrics-strip metrics-strip-vertical">
            <div className="metrics-strip-item">
              <FiHeart />
              <div>
                <p>Curtidas Totais</p>
                <strong className="mono-num">18.4K</strong>
              </div>
            </div>
            <div className="metrics-strip-item">
              <FiMessageSquare />
              <div>
                <p>Comentários</p>
                <strong className="mono-num">2.130</strong>
              </div>
            </div>
            <div className="metrics-strip-item">
              <FiShare2 />
              <div>
                <p>Compartilhamentos</p>
                <strong className="mono-num">970</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MÉTRICAS DE CONVERSÃO — selos percentuais + cards de valor */}
      <div className="metrics-section-header">
        <h2 className="section-title">Métricas de Conversão</h2>
      </div>

      <div className="metrics-conversion-row">
        <div className="metrics-badge">
          <span className="metrics-badge-ring mono-num">3.7%</span>
          <p>Taxa de Conversão</p>
        </div>

        <div className="metrics-badge">
          <span className="metrics-badge-ring mono-num">7.5%</span>
          <p>CTR</p>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiMousePointer />
            </div>
          </div>
          <p className="card-title">Cliques</p>
          <h2 className="card-value mono-num">9.600</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiTarget />
            </div>
          </div>
          <p className="card-title">Conversões</p>
          <h2 className="card-value mono-num">480</h2>
        </div>
      </div>

      {/* TABELA DE COMPARAÇÃO */}
      <div className="metrics-section-header">
        <h2 className="section-title">Comparação por Plataforma</h2>
      </div>

      <div className="table-container">
        <table className="table metrics-table">
          <thead>
            <tr>
              <th>Plataforma</th>
              <th>Seguidores</th>
              <th>Engajamento</th>
              <th>Receita</th>
              <th>ROI</th>
            </tr>
          </thead>
          <tbody>
            {comparacaoPlataformas.map((linha) => {
              const Icone = linha.icone;
              return (
                <tr key={linha.nome}>
                  <td>
                    <div className="metrics-table-platform">
                      <span className="metrics-table-icon" style={{ color: linha.cor }}>
                        <Icone />
                      </span>
                      {linha.nome}
                    </div>
                  </td>
                  <td className="mono-num">{linha.seguidores}</td>
                  <td>
                    <div className="metrics-table-bar-cell">
                      <span className="mono-num">{linha.engajamento}%</span>
                      <div className="metrics-table-bar">
                        <span style={{ width: `${linha.engajamento * 8}%`, background: linha.cor }} />
                      </div>
                    </div>
                  </td>
                  <td className="mono-num">{linha.receita}</td>
                  <td>
                    <div className="metrics-table-bar-cell">
                      <span className="mono-num">{linha.roi}%</span>
                      <div className="metrics-table-bar">
                        <span style={{ width: `${linha.roi}%`, background: linha.cor }} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default Metrics;
