/* importando o css da tela */
import "../styles/Meta.css";

/* Importando símbolos modernos e profissionais */
import { 
  FiDollarSign, FiEye, FiTarget, FiTrendingUp, 
  FiMousePointer, FiActivity, FiFacebook, FiInstagram 
} from "react-icons/fi";

function Meta() {
  return (
    <div className="dashboard-content">

      {/* TÍTULO */}
      <div className="page-header-title">
        <h1>Meta Ads</h1>
      </div>
      <p className="subtitle">
        Acompanhe suas campanhas no Facebook e Instagram
      </p>

      {/* CARDS PRINCIPAIS (Com a porcentagem verde +0%) */}
      <div className="cards-top">
        {/* Card 1: Investimento Total */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box meta-accent">
              <FiDollarSign />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Investimento Total</p>
          <h2 className="card-value">R$ 0,00</h2>
        </div>

        {/* Card 2: Alcance */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box meta-accent">
              <FiEye />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Alcance</p>
          <h2 className="card-value">0</h2>
        </div>

        {/* Card 3: Conversões */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box meta-accent">
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
            <div className="icon-box meta-accent">
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
            <div className="icon-box meta-accent">
              <FiEye />
            </div>
          </div>
          <p className="card-title">Impressões</p>
          <h2 className="card-value">0</h2>
        </div>

        {/* Cliques */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box meta-accent">
              <FiMousePointer />
            </div>
          </div>
          <p className="card-title">Cliques</p>
          <h2 className="card-value">0</h2>
        </div>

        {/* Frequência */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box meta-accent">
              <FiActivity />
            </div>
          </div>
          <p className="card-title">Frequência</p>
          <h2 className="card-value">0.00</h2>
        </div>

        {/* CPM */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box meta-accent">
              <FiDollarSign />
            </div>
          </div>
          <p className="card-title">CPM</p>
          <h2 className="card-value">R$ 0,00</h2>
        </div>
      </div>

      {/* SEÇÃO: POR PLATAFORMA */}
      <h2 className="section-title">Por Plataforma</h2>
      <div className="analytics-grid">
        {/* Facebook */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <FiFacebook className="section-icon fb-color" />
            <h2>Facebook</h2>
          </div>
          <div className="stats-grid">
            <div>
              <p>Gasto</p>
              <h1>R$ 0</h1>
            </div>
            <div>
              <p>Alcance</p>
              <h1>0</h1>
            </div>
            <div>
              <p>Cliques</p>
              <h1>0</h1>
            </div>
            <div>
              <p>ROAS</p>
              <h1>0.00x</h1>
            </div>
          </div>
        </div>

        {/* Instagram */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <FiInstagram className="section-icon ig-color" />
            <h2>Instagram</h2>
          </div>
          <div className="stats-grid">
            <div>
              <p>Gastos</p>
              <h1>R$ 0</h1>
            </div>
            <div>
              <p>Alcance</p>
              <h1>0</h1>
            </div>
            <div>
              <p>Cliques</p>
              <h1>0</h1>
            </div>
            <div>
              <p>ROAS</p>
              <h1>0.00x</h1>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Meta;