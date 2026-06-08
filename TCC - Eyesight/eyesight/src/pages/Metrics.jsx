/* importando o css da tela */
import "../styles/Metrics.css";

/* Importando símbolos profissionais e modernos */
import { 
  FiDollarSign, FiUsers, FiActivity, FiTarget, 
  FiTrendingUp, FiHeart, FiMessageSquare, FiShare2, 
  FiMousePointer, FiPercent, FiBarChart2 
} from "react-icons/fi";

function Metrics() {
  return (
    /* conteúdo principal */
    <div className="dashboard-content">

      {/* titulo da página */}
      <div className="page-header-title">
        <h1>Métricas</h1>
      </div>

      {/* subtitulo da tela */}
      <p className="subtitle">Visão unificada de todas as suas métricas de performance</p>

      {/* CARDS PRINCIPAIS (Com "+0% vs mês anterior" embaixo do valor) */}
      <div className="metrics-grid">
        {/* Receita Total */}
        <div className="card top-row-card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiDollarSign />
            </div>
          </div>
          <p className="card-title">Receita Total</p>
          <h2 className="card-value">R$ 0</h2>
          <span className="month-comparison-text">+0% vs mês anterior</span>
        </div>

        {/* Audiência Total */}
        <div className="card top-row-card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiUsers />
            </div>
          </div>
          <p className="card-title">Audiência Total</p>
          <h2 className="card-value">0</h2>
          <span className="month-comparison-text">+0% vs mês anterior</span>
        </div>

        {/* Engajamento */}
        <div className="card top-row-card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiActivity />
            </div>
          </div>
          <p className="card-title">Engajamento</p>
          <h2 className="card-value">0%</h2>
          <span className="month-comparison-text">+0% vs mês anterior</span>
        </div>

        {/* Conversões */}
        <div className="card top-row-card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiTarget />
            </div>
          </div>
          <p className="card-title">Conversões</p>
          <h2 className="card-value">0</h2>
          <span className="month-comparison-text">+0% vs mês anterior</span>
        </div>
      </div>

      {/* SEÇÃO 2: MÉTRICAS DE RECEITA */}
      <h2 className="section-title">Métricas de Receita</h2>
      <div className="metrics-grid">
        <div className="card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiDollarSign />
            </div>
          </div>
          <p className="card-title">Receita Total</p>
          <h2 className="card-value">R$ 0,00</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiBarChart2 />
            </div>
          </div>
          <p className="card-title">Ticket Médio</p>
          <h2 className="card-value">R$ 0,00</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiTrendingUp />
            </div>
          </div>
          <p className="card-title">LTV</p>
          <h2 className="card-value">R$ 0,00</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiPercent />
            </div>
          </div>
          <p className="card-title">ROI Geral</p>
          <h2 className="card-value">0%</h2>
        </div>
      </div>

      {/* SEÇÃO 3: MÉTRICAS DE AUDIÊNCIA */}
      <h2 className="section-title">Métricas de Audiência</h2>
      <div className="metrics-grid">
        <div className="card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiUsers />
            </div>
          </div>
          <p className="card-title">Total de Seguidores</p>
          <h2 className="card-value">0</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiBarChart2 />
            </div>
          </div>
          <p className="card-title">Alcance Total</p>
          <h2 className="card-value">0</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiActivity />
            </div>
          </div>
          <p className="card-title">Impressões</p>
          <h2 className="card-value">0</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiTrendingUp />
            </div>
          </div>
          <p className="card-title">Crescimento</p>
          <h2 className="card-value">+0%</h2>
        </div>
      </div>

      {/* SEÇÃO 4: MÉTRICAS DE ENGAJAMENTO */}
      <h2 className="section-title">Métricas de Engajamento</h2>
      <div className="metrics-grid">
        <div className="card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiActivity />
            </div>
          </div>
          <p className="card-title">Taxa de Engajamento</p>
          <h2 className="card-value">0%</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiHeart />
            </div>
          </div>
          <p className="card-title">Curtidas Totais</p>
          <h2 className="card-value">0</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiMessageSquare />
            </div>
          </div>
          <p className="card-title">Comentários</p>
          <h2 className="card-value">0</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiShare2 />
            </div>
          </div>
          <p className="card-title">Compartilhamentos</p>
          <h2 className="card-value">0</h2>
        </div>
      </div>

      {/* SEÇÃO 5: MÉTRICAS DE CONVERSÃO */}
      <h2 className="section-title">Métricas de Conversão</h2>
      <div className="metrics-grid">
        <div className="card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiPercent />
            </div>
          </div>
          <p className="card-title">Taxa de Conversão</p>
          <h2 className="card-value">0%</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiMousePointer />
            </div>
          </div>
          <p className="card-title">Cliques</p>
          <h2 className="card-value">0</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiBarChart2 />
            </div>
          </div>
          <p className="card-title">CTR</p>
          <h2 className="card-value">0%</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box metrics-accent">
              <FiTarget />
            </div>
          </div>
          <p className="card-title">Conversões</p>
          <h2 className="card-value">0</h2>
        </div>
      </div>

      {/* TABELA DE COMPARAÇÃO */}
      <h2 className="section-title">Comparação por Plataforma</h2>
      <div className="table-container">
        <table className="table">
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
            <tr>
              <td>TikTok</td>
              <td>0</td>
              <td>0%</td>
              <td>R$ 0,00</td>
              <td>0%</td>
            </tr>
            <tr>
              <td>TikTok Shop</td>
              <td>0</td>
              <td>0%</td>
              <td>R$ 0,00</td>
              <td>0%</td>
            </tr>
            <tr>
              <td>Instagram</td>
              <td>0</td>
              <td>0%</td>
              <td>R$ 0,00</td>
              <td>0%</td>
            </tr>
            <tr>
              <td>Google Ads</td>
              <td>0</td>
              <td>0%</td>
              <td>R$ 0,00</td>
              <td>0%</td>
            </tr>
            <tr>
              <td>Meta Ads</td>
              <td>0</td>
              <td>0%</td>
              <td>R$ 0,00</td>
              <td>0%</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default Metrics;