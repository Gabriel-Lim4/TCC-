import "../styles/Tools.css";
import { FaDollarSign } from "react-icons/fa";
import { FiUsers } from "react-icons/fi";
import { AiOutlineEye } from "react-icons/ai";
import { FiTrendingUp } from "react-icons/fi";

function Tools() {
  return (
    <div className="dashboard-content">
      <h1>Ferramentas</h1>
      <p className="subtitle">Acesse ferramentas poderosas para otimizar seu trabalho</p>

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

      <h2 style={{ marginTop: "30px" }}>Planejamento</h2>

      <div className="platforms-grid">
        <div className="card">
          <h3>Agendador de Posts</h3>
          <p>Agende publicações para todas as plataformas</p>
        </div>

        <div className="card">
          <h3>Calendário de Conteúdo</h3>
          <p>Organize seu calendário editorial</p>
        </div>

        <h2 style={{ marginTop: "30px" }}>Criação</h2>
        <div className="platforms-grid">
        <div className="card">
          <h3>Editor de Imagens</h3>
          <p>Edite imagens para suas redes sociais</p>
        </div>

        <div className="card">
          <h3>Gerador de Hashtags</h3>
          <p>Encontre as melhores hashtags para seu conteúdo</p>
        </div>
      </div>
      </div>
    </div>
  );
}

export default Tools;