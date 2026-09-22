import "../styles/Dashboard.css";
import "../styles/variables.css";

import { FaBullhorn, } from "react-icons/fa";
import { FiTrendingUp, FiFacebook, FiInstagram, FiArrowRight, FiRadio } from "react-icons/fi";
import { AiOutlineGlobal, AiOutlineSliders } from "react-icons/ai";
import { HiOutlineLightBulb, HiOutlineSparkles } from "react-icons/hi";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function Dashboard() {

  const lineData = [
    { dia: "Seg", alcance: 120 },
    { dia: "Ter", alcance: 280 },
    { dia: "Qua", alcance: 350 },
    { dia: "Qui", alcance: 500 },
    { dia: "Sex", alcance: 650 },
    { dia: "Sab", alcance: 720 },
    { dia: "Dom", alcance: 900 },
  ];

  const pieData = [
    { name: "Instagram", value: 40 },
    { name: "TikTok", value: 30 },
    { name: "Google Ads", value: 20 },
    { name: "Meta Ads", value: 10 },
  ];

  const COLORS = [
    "#e1306c",
    "#00f2ea",
    "#f4b400",
    "#1877f2",
  ];

  // tooltip customizado do gráfico de crescimento, no mesmo tom do resto do dashboard
  const GrowthTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="dash-tooltip">
          <span className="dash-tooltip-label">{label}</span>
          <span className="dash-tooltip-value">
            {payload[0].value.toLocaleString("pt-BR")} <small>alcance</small>
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-content">
      {/* camada decorativa de fundo — dois halos suaves em azul/roxo, só estética */}
      <div className="dash-bg-mesh" aria-hidden="true" />

      {/* cabeçalho no estilo das ferramentas de analytics de mercado */}
      <div className="dash-header">
        <div>
          <span className="dash-eyebrow">
            <HiOutlineSparkles /> Painel &middot; Marketing Analytics
          </span>
          <h1>Início</h1>
          <p className="subtitle">Visão geral consolidada das suas plataformas</p>
        </div>

        <div className="dash-header-right">
          <span className="dash-live-pill">
            <FiRadio className="dash-live-dot" /> Sincronizado agora
          </span>
          <div className="dash-period-pills">
            <button className="dash-period-pill is-active" type="button">7D</button>
            <button className="dash-period-pill" type="button">30D</button>
            <button className="dash-period-pill" type="button">90D</button>
          </div>
        </div>
      </div>

      {/* Visão geral: alcance em destaque (com mini-gráfico) + indicadores compactos + ROI */}
      <div className="dash-overview-row">
        <div className="card dash-highlight-card">
          <div className="card-header">
            <div className="icon-box">
              <FiTrendingUp />
            </div>
            <span className="green-text">+18%</span>
          </div>
          <p className="card-title">Alcance Total</p>
          <h2 className="card-value mono-num">54.2K</h2>

          <div className="dash-mini-chart">
            <ResponsiveContainer width="100%" height={48}>
              <AreaChart data={lineData}>
                <defs>
                  <linearGradient id="miniAlcance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="alcance"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#miniAlcance)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dash-mini-stack">
          <div className="dash-mini-stat">
            <div className="icon-box">
              <FaBullhorn />
            </div>
            <div>
              <p>Campanhas Ativas</p>
              <strong className="mono-num">11</strong>
              <span className="green-text"> +12%</span>
            </div>
          </div>

          <div className="dash-mini-stat">
            <div className="icon-box">
              <FiInstagram />
            </div>
            <div>
              <p>Engajamento Médio</p>
              <strong className="mono-num">7.8%</strong>
              <span className="green-text"> +8%</span>
            </div>
          </div>
        </div>

        <div className="card dash-roi-card">
          <AiOutlineGlobal className="dash-roi-icon" />
          <h2 className="dash-roi-value mono-num">3.4x</h2>
          <span className="dash-roi-line" />
          <p className="card-title">ROI Médio</p>
          <span className="green-text">+22%</span>
        </div>
      </div>

      <div className="charts-container">

        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <span className="chart-eyebrow">Desempenho</span>
              <h3>Crescimento Semanal</h3>
            </div>
            <span className="dash-period-tag">Últimos 7 dias</span>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={lineData}>
              <defs>
                <linearGradient id="alcanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="dia"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                width={36}
              />
              <Tooltip content={<GrowthTooltip />} cursor={{ stroke: "#334155", strokeDasharray: "4 4" }} />
              <Area
                type="monotone"
                dataKey="alcance"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#alcanceGradient)"
                activeDot={{ r: 5, fill: "#3b82f6", stroke: "#0f172a", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <span className="chart-eyebrow">Investimento</span>
              <h3>Distribuição das Plataformas</h3>
            </div>
          </div>

          <div className="dash-donut-wrap">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={3}
                  stroke="#0f172a"
                  strokeWidth={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value}%`, name]}
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: 10,
                    color: "#e2e8f0",
                    fontSize: 13,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="dash-donut-center">
              <strong className="mono-num">100%</strong>
              <span>investido</span>
            </div>
          </div>

          <ul className="dash-legend">
            {pieData.map((entry, index) => (
              <li key={entry.name} className="dash-legend-item">
                <span className="dash-legend-dot" style={{ background: COLORS[index] }} />
                <span className="dash-legend-name">{entry.name}</span>
                <span className="dash-legend-value mono-num">{entry.value}%</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* insights automáticos, lidos a partir dos dados acima */}
      <div className="dash-insights-grid">
        <div className="dash-insight">
          <div className="dash-insight-icon">
            <HiOutlineLightBulb />
          </div>
          <div>
            <p className="dash-insight-title">Pico no fim de semana</p>
            <p className="dash-insight-text">Sábado e domingo concentram cerca de 46% de todo o alcance da semana.</p>
          </div>
        </div>

        <div className="dash-insight">
          <div className="dash-insight-icon">
            <HiOutlineLightBulb />
          </div>
          <div>
            <p className="dash-insight-title">Instagram lidera engajamento</p>
            <p className="dash-insight-text">Média de 7.8% de engajamento, acima da meta interna de 5%.</p>
          </div>
        </div>

        <div className="dash-insight">
          <div className="dash-insight-icon">
            <HiOutlineLightBulb />
          </div>
          <div>
            <p className="dash-insight-title">ROI consolidado em alta</p>
            <p className="dash-insight-text">Retorno médio de 3.4x sobre o investido, 22% acima do período anterior.</p>
          </div>
        </div>
      </div>

      <div className="dash-section-header">
        <h2>Suas Plataformas</h2>
        <span className="dash-period-tag">4 conectadas</span>
      </div>

      <div className="dash-platforms-row">
        {/* TikTok em destaque: é a plataforma com mais perfis conectados */}
        <div className="card dash-platform-featured">
          <span className="dash-platform-badge">30% do investimento</span>
          <div className="card-platform-header">
            <div className="icon-box icon-tiktok">
              <FiInstagram />
            </div>
            <div>
              <h3>Instagram</h3>
              <p>2 perfis conectados</p>
            </div>
          </div>
          <a href="/app/instagram" className="dash-platform-link">
            Ver detalhes <FiArrowRight />
          </a>
        </div>

        {/* As demais plataformas, em lista compacta */}
        <div className="dash-platform-list">
          <div className="dash-platform-list-item">
            <div className="icon-box icon-instagram">
              <FiFacebook />
            </div>
            <div className="dash-platform-list-info">
              <div className="dash-platform-list-top">
                <h4>Facebook</h4>
                <span className="mono-num">1 perfil</span>
              </div>
              <div className="dash-platform-share-bar">
                <span className="dash-platform-share-fill" style={{ width: "40%", background: COLORS[0] }} />
              </div>
            </div>
          </div>

          <div className="dash-platform-list-item">
            <div className="icon-box icon-google">
              <AiOutlineGlobal />
            </div>
            <div className="dash-platform-list-info">
              <div className="dash-platform-list-top">
                <h4>Google Ads</h4>
                <span className="mono-num">3 campanhas</span>
              </div>
              <div className="dash-platform-share-bar">
                <span className="dash-platform-share-fill" style={{ width: "20%", background: COLORS[2] }} />
              </div>
            </div>
          </div>

          <div className="dash-platform-list-item">
            <div className="icon-box icon-meta">
              <AiOutlineSliders />
            </div>
            <div className="dash-platform-list-info">
              <div className="dash-platform-list-top">
                <h4>Meta Ads</h4>
                <span className="mono-num">5 campanhas</span>
              </div>
              <div className="dash-platform-share-bar">
                <span className="dash-platform-share-fill" style={{ width: "10%", background: COLORS[3] }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;