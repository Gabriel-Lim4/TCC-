/* importando o css da tela */
import "../styles/Google.css";
import "../styles/variables.css";

import {
  FiDollarSign, FiMousePointer, FiTarget, FiTrendingUp,
  FiEye, FiPercent, FiSearch, FiMonitor, FiShoppingBag
} from "react-icons/fi";

function Google() {
  return (
    <div className="dashboard-content">
      <div className="page-header-title">
        <h1>Google Ads</h1>
      </div>

      <p className="subtitle">Gerencie e acompanhe suas campanhas do Google Ads</p>

      {/* Visão geral: 4 cards de mesmo tamanho, lado a lado */}
      <div className="google-overview-row">
        <div className="card">
          <div className="card-header">
            <div className="icon-box google-accent">
              <FiDollarSign />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Investimento Total</p>
          <h2 className="card-value">R$ 0,00</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box google-accent">
              <FiMousePointer />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Cliques</p>
          <h2 className="card-value">0</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box google-accent">
              <FiTarget />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Conversões</p>
          <h2 className="card-value">0</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="icon-box google-accent">
              <FiTrendingUp />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">ROAS</p>
          <h2 className="card-value">0.00x</h2>
        </div>
      </div>

      {/* Métricas de performance: faixa única */}
      <h2 className="section-title">Métricas de Performance</h2>
      <div className="google-strip">
        <div className="google-strip-item">
          <FiEye />
          <div>
            <p>Impressões</p>
            <strong>0</strong>
          </div>
        </div>
        <div className="google-strip-item">
          <FiPercent />
          <div>
            <p>CTR</p>
            <strong>0%</strong>
          </div>
        </div>
        <div className="google-strip-item">
          <FiDollarSign />
          <div>
            <p>CPC Médio</p>
            <strong>R$ 0,00</strong>
          </div>
        </div>
        <div className="google-strip-item">
          <FiTarget />
          <div>
            <p>CPA</p>
            <strong>R$ 0,00</strong>
          </div>
        </div>
      </div>

      {/* Campanhas ativas */}
      <h2 className="section-title">Campanhas Ativas</h2>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nome da Campanha</th>
              <th>Status</th>
              <th>Orçamento</th>
              <th>Gasto</th>
              <th>Cliques</th>
              <th>Conversões</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Campanha de Vendas - Produto A</td>
              <td><span className="status active">Ativa</span></td>
              <td>R$ 0/dia</td>
              <td>R$ 0</td>
              <td>0</td>
              <td>0</td>
            </tr>
            <tr>
              <td>Campanha de Awareness - Marca</td>
              <td><span className="status active">Ativa</span></td>
              <td>R$ 0/dia</td>
              <td>R$ 0</td>
              <td>0</td>
              <td>0</td>
            </tr>
            <tr>
              <td>Campanha de Remarketing</td>
              <td><span className="status paused">Pausada</span></td>
              <td>R$ 0/dia</td>
              <td>R$ 0</td>
              <td>0</td>
              <td>0</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Por tipo de campanha: 3 cards de mesmo tamanho */}
      <h2 className="section-title">Por Tipo de Campanha</h2>
      <div className="google-type-row">
        <div className="card type">
          <div className="card-header">
            <div className="icon-box google-accent">
              <FiSearch />
            </div>
          </div>
          <h3>Search</h3>
          <p>Gasto</p>
          <h2 className="card-value">R$ 0</h2>
          <span className="card-extra-info">Cliques: 0</span>
        </div>

        <div className="card type">
          <div className="card-header">
            <div className="icon-box google-accent">
              <FiMonitor />
            </div>
          </div>
          <h3>Display</h3>
          <p>Gasto</p>
          <h2 className="card-value">R$ 0</h2>
          <span className="card-extra-info">Impressões: 0</span>
        </div>

        <div className="card type">
          <div className="card-header">
            <div className="icon-box google-accent">
              <FiShoppingBag />
            </div>
          </div>
          <h3>Shopping</h3>
          <p>Gasto</p>
          <h2 className="card-value">R$ 0</h2>
          <span className="card-extra-info">Vendas: 0</span>
        </div>
      </div>
    </div>
  );
}

export default Google;