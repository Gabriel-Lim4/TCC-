import "../styles/Dashboard.css";
import { FaDollarSign, FaTiktok, FaInstagram } from "react-icons/fa";
import { FiUsers, FiTrendingUp, FiInstagram } from "react-icons/fi"; 
import { AiOutlineEye, AiOutlineGlobal, AiOutlineSliders } from "react-icons/ai"; 

function Dashboard() {
  return (
    <div className="dashboard-content">
      <h1>Início</h1>
      <p className="subtitle">Visão geral das plataformas</p>

      <div className="cards-top">
        {/* Card 1: Receita Total */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box">
              <FaDollarSign />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Receita Total</p>
          <h2 className="card-value">R$ 0,00</h2>
        </div>

        {/* Card 2: Audiência */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box">
              <FiUsers />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Audiência Total</p>
          <h2 className="card-value">0</h2>
        </div>

        {/* Card 3: Visualizações */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box">
              <AiOutlineEye />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Visualizações</p>
          <h2 className="card-value">0</h2>
        </div>

        {/* Card 4: Conversão */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box">
              <FiTrendingUp />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Taxa de Conversão</p>
          <h2 className="card-value">0%</h2>
        </div>
      </div>

      <h2 style={{ marginTop: "30px" }}>Suas Plataformas</h2>

      <div className="platforms-grid">
        {/* Card TikTok */}
        <div className="card">
          <div className="card-platform-header">
            <div className="icon-box icon-tiktok">
              <FaTiktok />
            </div>
            <h3>TikTok</h3>
          </div>
          <p>2 perfis conectados</p>
        </div>

        {/* Card Instagram */}
        <div className="card">
          <div className="card-platform-header">
            <div className="icon-box icon-instagram">
              <FiInstagram />
            </div>
            <h3>Instagram</h3>
          </div>
          <p>1 perfil conectado</p>
        </div>

        {/* Card Google Ads */}
        <div className="card">
          <div className="card-platform-header">
            <div className="icon-box icon-google">
              <AiOutlineGlobal /> 
            </div>
            <h3>Google Ads</h3>
          </div>
          <p>3 campanhas ativas</p>
        </div>

        {/* Card Meta Ads */}
        <div className="card">
          <div className="card-platform-header">
            <div className="icon-box icon-meta">
              <AiOutlineSliders /> 
            </div>
            <h3>Meta Ads</h3>
          </div>
          <p>5 campanhas ativas</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;