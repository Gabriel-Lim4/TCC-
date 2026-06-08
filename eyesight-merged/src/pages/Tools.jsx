import "../styles/Tools.css";
import { FiCalendar, FiFileText } from "react-icons/fi"; // Ícones elegantes de linha para os cards

function Tools() {
  return (
    <div className="tools-content">
      <h1>Ferramentas</h1>
      <p className="subtitle">Acesse ferramentas poderosas para otimizar seu trabalho</p>

      {/* BANNER DE DESTAQUE: Agendador de Posts com IA */}
      <div className="featured-banner">
        <div className="featured-info">
          <div className="badge-container">
          </div>
          <h2>Agendador de Posts com IA</h2>
          <p>
            Agende suas publicações de forma inteligente com sugestões de horários 
            otimizados por IA para maximizar o engajamento.
          </p>
          <button className="btn-primary-gradient">Experimentar Agora</button>
        </div>
        <div className="featured-icon-box">
          <FiCalendar />
        </div>
      </div>

      {/* SEÇÃO: Planejamento */}
      <h2 className="section-title">Planejamento</h2>

      <div className="tools-grid">
        {/* Card 1: Agendador de Posts */}
        <div className="tool-card">
          <div className="tool-card-header">
            <div className="tool-icon-box">
              <FiCalendar />
            </div>
            <span className="status-badge">Disponível</span>
          </div>
          
          <div className="tool-card-body">
            <h3>Agendador de Posts</h3>
            <p>Agende publicações para todas as plataformas</p>
          </div>

          <button className="btn-secondary">Abrir Ferramenta</button>
        </div>

        {/* Card 2: Calendário de Conteúdo */}
        <div className="tool-card">
          <div className="tool-card-header">
            <div className="tool-icon-box">
              <FiFileText />
            </div>
            <span className="status-badge">Disponível</span>
          </div>
          
          <div className="tool-card-body">
            <h3>Calendário de Conteúdo</h3>
            <p>Organize seu calendário editorial</p>
          </div>

          <button className="btn-secondary">Abrir Ferramenta</button>
        </div>
      </div>
    </div>
  );
}

export default Tools;