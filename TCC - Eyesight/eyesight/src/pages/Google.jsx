/* importando o css da tela */
import "../styles/Google.css";

/* Importando símbolos modernos e profissionais */
import { 
  FiDollarSign, FiMousePointer, FiTarget, FiTrendingUp, 
  FiEye, FiPercent, FiSearch, FiMonitor, FiShoppingBag 
} from "react-icons/fi";

function Google() {
  return (
    <div className="dashboard-content">
      {/* Título da página */}
      <div className="page-header-title">
        <h1>Google Ads</h1>
      </div>
      
      {/* Subtítulo da tela */}
      <p className="subtitle">Gerencie e acompanhe suas campanhas do Google Ads</p>

      {/* CARDS PRINCIPAIS (Com a porcentagem verde +0%) */}
      <div className="cards-top">
        {/* Card 1: Investimento Total */}
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

        {/* Card 2: Cliques */}
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

        {/* Card 3: Conversões */}
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

        {/* Card 4: ROAS */}
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

      {/* SEGUNDA SEÇÃO: MÉTRICAS DE PERFORMANCE (Sem o +0%) */}
      <h2 className="section-title">Métricas de Performance</h2>
      <div className="cards-top">
        {/* Impressões */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box google-accent">
              <FiEye />
            </div>
          </div>
          <p className="card-title">Impressões</p>
          <h2 className="card-value">0</h2>
        </div>

        {/* CTR */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box google-accent">
              <FiPercent />
            </div>
          </div>
          <p className="card-title">CTR</p>
          <h2 className="card-value">0%</h2>
        </div>

        {/* CPC Médio */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box google-accent">
              <FiDollarSign />
            </div>
          </div>
          <p className="card-title">CPC Médio</p>
          <h2 className="card-value">R$ 0,00</h2>
        </div>

        {/* CPA */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box google-accent">
              <FiTarget />
            </div>
          </div>
          <p className="card-title">CPA</p>
          <h2 className="card-value">R$ 0,00</h2>
        </div>
      </div>

      {/* TABELA DE CAMPANHAS ATIVAS */}
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

      {/* POR TIPO DE CAMPANHA */}
      <h2 className="section-title">Por Tipo de Campanha</h2>
      <div className="cards-top">
        {/* Search */}
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

        {/* Display */}
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

        {/* Shopping */}
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