import "../styles/Dashboard.css";
import { FaDollarSign } from "react-icons/fa";
import { FiUsers } from "react-icons/fi";
import { AiOutlineEye } from "react-icons/ai";
import { FiTrendingUp } from "react-icons/fi";

function Dashboard() {
  return (
    <div className="dashboard-content">
      <h1>Início</h1>
      <p className="subtitle">Visão geral das plataformas</p>

      <div className="cards-top">
        <div className="card">

          <div className="card-header">

            <div className="icon-box">
              <FaDollarSign />
            </div>

            <span className="green-text">+0%</span>

          </div>

          <p>Receita Total</p>
          <h2>R$ 0,00</h2>

        </div>

        <div className="card">
          <p>Audiência</p>
          <h2>0</h2>
        </div>

        <div className="card">
          <p>Visualizações</p>
          <h2>0</h2>
        </div>

        <div className="card">
          <p>Conversão</p>
          <h2>0%</h2>
        </div>
      </div>

      <h2 style={{ marginTop: "30px" }}>Suas Plataformas</h2>

      <div className="platforms-grid">
        <div className="card">
          <h3>TikTok</h3>
          <p>2 perfis conectados</p>
        </div>

        <div className="card">
          <h3>Instagram</h3>
          <p>1 perfil conectado</p>
        </div>

        <div className="card">
          <h3>Google Ads</h3>
          <p>3 campanhas ativas</p>
        </div>

        <div className="card">
          <h3>Meta Ads</h3>
          <p>5 campanhas ativas</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;