/* importando o css da tela */
import "../styles/Tiktok.css";

/* Importando símbolos modernos e seguros */
import { FiUsers, FiEye, FiHeart, FiTrendingUp, FiMessageSquare, FiShare2 } from "react-icons/fi";
import { FaTiktok } from "react-icons/fa";

function TikTok() {
  return (
    <div className="dashboard-content">
      {/* Título da página com ícone temático */}
      <div className="page-header-title">
        <h1>TikTok</h1>
      </div>
      
      {/* Subtítulo da tela */}
      <p className="subtitle">Acompanhe o desempenho dos seus perfis e vídeos no TikTok</p>

     {/* CARDS PRINCIPAIS (Métricas Gerais) */}
      <div className="cards-top">
        {/* Card 1: Seguidores */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box tiktok-accent">
              <FiUsers />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Seguidores</p>
          <h2 className="card-value">0</h2>
        </div>

        {/* Card 2: Visualizações */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box tiktok-accent">
              <FiEye />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Visualizações</p>
          <h2 className="card-value">0</h2>
        </div>

        {/* Card 3: Curtidas */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box tiktok-accent">
              <FiHeart />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Curtidas</p>
          <h2 className="card-value">0</h2>
        </div>

        {/* Card 4: Taxa de Engajamento */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box tiktok-accent">
              <FiTrendingUp />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Taxa de Engajamento</p>
          <h2 className="card-value">0%</h2>
        </div>
      </div>

      {/* Título da segunda seção */}
      <h2 className="section-title">Detalhamento de Engajamento</h2>

      {/* CARDS SECUNDÁRIOS */}
      <div className="cards-top" style={{ marginTop: "20px" }}>
        {/* Curtidas Totais */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box tiktok-accent">
              <FiHeart />
            </div>
          </div>
          <p className="card-title">Curtidas Totais</p>
          <h2 className="card-value">0</h2>
        </div>

        {/* Comentários Totais */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box tiktok-accent">
              <FiMessageSquare />
            </div>
          </div>
          <p className="card-title">Comentários Totais</p>
          <h2 className="card-value">0</h2>
        </div>

        {/* Compartilhamentos */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box tiktok-accent">
              <FiShare2 />
            </div>
          </div>
          <p className="card-title">Compartilhamentos</p>
          <h2 className="card-value">0</h2>
        </div>
      </div>

      {/* VÍDEOS RECENTES */}
      <h2 className="section-title">Vídeos Recentes</h2>
      
      <div className="posts-grid">
        {/* Card de Vídeo 1 */}
        <div className="post-card">
          <div className="post-image">
            <FaTiktok className="placeholder-tiktok-icon" />
          </div>
          <div className="post-info">
            <span><FiHeart /> 0</span>
            <span><FiMessageSquare /> 0</span>
            <span><FiShare2 /> 0</span>
          </div>
        </div>

        {/* Card de Vídeo 2 */}
        <div className="post-card">
          <div className="post-image">
            <FaTiktok className="placeholder-tiktok-icon" />
          </div>
          <div className="post-info">
            <span><FiHeart /> 0</span>
            <span><FiMessageSquare /> 0</span>
            <span><FiShare2 /> 0</span>
          </div>
        </div>

        {/* Card de Vídeo 3 */}
        <div className="post-card">
          <div className="post-image">
            <FaTiktok className="placeholder-tiktok-icon" />
          </div>
          <div className="post-info">
            <span><FiHeart /> 0</span>
            <span><FiMessageSquare /> 0</span>
            <span><FiShare2 /> 0</span>
          </div>
        </div>

        {/* Card de Vídeo 4 */}
        <div className="post-card">
          <div className="post-image">
            <FaTiktok className="placeholder-tiktok-icon" />
          </div>
          <div className="post-info">
            <span><FiHeart /> 0</span>
            <span><FiMessageSquare /> 0</span>
            <span><FiShare2 /> 0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TikTok;