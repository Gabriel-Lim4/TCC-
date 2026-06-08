/* importando o css da tela */
import "../styles/Instagram.css";

/* Importando símbolos modernos e seguros */
import { 
  FiUsers, FiEye, FiHeart, FiTrendingUp, 
  FiMessageSquare, FiBookmark, FiShare2, FiInstagram, FiVideo 
} from "react-icons/fi";

function Instagram() {
  return (
    <div className="dashboard-content">
      {/* Título da página */}
      <div className="page-header-title">
        <h1>Instagram</h1>
      </div>

      {/* Subtítulo */}
      <p className="subtitle">
        Análise completa do desempenho da sua conta no Instagram
      </p>

      {/* CARDS PRINCIPAIS (Com a porcentagem verde +0%) */}
      <div className="cards-top">
        {/* Card 1: Seguidores */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box instagram-accent">
              <FiUsers />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Seguidores</p>
          <h2 className="card-value">0</h2>
        </div>

        {/* Card 2: Alcance */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box instagram-accent">
              <FiEye />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Alcance</p>
          <h2 className="card-value">0</h2>
        </div>

        {/* Card 3: Curtidas */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box instagram-accent">
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
            <div className="icon-box instagram-accent">
              <FiTrendingUp />
            </div>
            <span className="green-text">+0%</span>
          </div>
          <p className="card-title">Taxa de Engajamento</p>
          <h2 className="card-value">0%</h2>
        </div>
      </div>

      {/* SEGUNDA SEÇÃO: ESTATÍSTICAS DE ENGAJAMENTO (Sem o +0%) */}
      <h2 className="section-title">Estatísticas de Engajamento</h2>
      <div className="cards-top">
        {/* Curtidas */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box instagram-accent">
              <FiHeart />
            </div>
          </div>
          <p className="card-title">Curtidas</p>
          <h2 className="card-value">0</h2>
        </div>

        {/* Comentários */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box instagram-accent">
              <FiMessageSquare />
            </div>
          </div>
          <p className="card-title">Comentários</p>
          <h2 className="card-value">0</h2>
        </div>

        {/* Salvamentos */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box instagram-accent">
              <FiBookmark />
            </div>
          </div>
          <p className="card-title">Salvamentos</p>
          <h2 className="card-value">0</h2>
        </div>

        {/* Compartilhamentos */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box instagram-accent">
              <FiShare2 />
            </div>
          </div>
          <p className="card-title">Compartilhamentos</p>
          <h2 className="card-value">0</h2>
        </div>
      </div>

      {/* POSTS RECENTES */}
      <h2 className="section-title">Posts Recentes</h2>
      <div className="posts-grid">
        {[1, 2, 3, 4].map((post) => (
          <div className="post-card" key={post}>
            <div className="post-image">
              <FiInstagram className="placeholder-insta-icon" />
            </div>
            <div className="post-info">
              <span><FiHeart /> 0</span>
              <span><FiMessageSquare /> 0</span>
              <span><FiShare2 /> 0</span>
            </div>
          </div>
        ))}
      </div>

      {/* STORIES E REELS */}
      <div className="analytics-grid">
        {/* STORIES */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <FiInstagram className="section-icon" />
            <h2>Stories</h2>
          </div>
          <div className="stats-grid">
            <div>
              <p>Publicados (7d)</p>
              <h1>0</h1>
            </div>
            <div>
              <p>Visualizações</p>
              <h1>0</h1>
            </div>
            <div>
              <p>Alcance</p>
              <h1>0</h1>
            </div>
            <div>
              <p>Interações</p>
              <h1>0</h1>
            </div>
          </div>
        </div>

        {/* REELS */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <FiVideo className="section-icon" />
            <h2>Reels</h2>
          </div>
          <div className="stats-grid">
            <div>
              <p>Publicados (30d)</p>
              <h1>0</h1>
            </div>
            <div>
              <p>Visualizações</p>
              <h1>0</h1>
            </div>
            <div>
              <p>Curtidas</p>
              <h1>0</h1>
            </div>
            <div>
              <p>Compartilhamentos</p>
              <h1>0</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Instagram;