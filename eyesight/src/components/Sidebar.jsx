import { Link, useLocation } from "react-router-dom";

/* Importando ícones super tradicionais e seguros do react-icons */
import { FiHome, FiInstagram, FiTrendingUp, FiUsers } from "react-icons/fi";
import { FaTiktok } from "react-icons/fa";
import { SiGoogleads } from "react-icons/si";
import { MdOutlineDoubleArrow, MdOutlineSettings, MdAndroid } from "react-icons/md"; 
import logo from "../assets/logo.png";
import "../styles/Sidebar.css";

function Sidebar() {
  const location = useLocation();

  // Função para verificar a página ativa
  const isActive = (path) => location.pathname === path ? "active-purple" : "";

  return (
    <aside className="sidebar">
      <div>
        <img src={logo} alt="Eyesight Logo" style={{ width: "50px", height: "50px", objectFit: "contain" }} />
        {/* Titulo do sistema */}
        <h2>EYESIGHT</h2>

        <ul>
          <li className={isActive("/app")}>
            <Link to="/app">
              <FiHome /> Início
            </Link>
          </li>

          <li className={isActive("/app/tiktok")}>
            <Link to="/app/tiktok">
              <FaTiktok /> TikTok
            </Link>
          </li>

          <li className={isActive("/app/instagram")}>
            <Link to="/app/instagram">
              <FiInstagram /> Instagram
            </Link>
          </li>

          <li className={isActive("/app/google")}>
            <Link to="/app/google">
              <SiGoogleads /> Google Ads
            </Link>
          </li>

          <li className={isActive("/app/meta")}>
            <Link to="/app/meta">
              {/* Usando o do Google provisoriamente para testar se a tela volta */}
              <SiGoogleads /> Meta Ads
            </Link>
          </li>

          <li className={isActive("/app/metrics")}>
            <Link to="/app/metrics">
              <FiTrendingUp /> Métricas
            </Link>
          </li>

          <li className={isActive("/app/accounts")}>
            <Link to="/app/accounts">
              <FiUsers /> Contas
            </Link>
          </li>

          <li className={isActive("/app/assistant")}>
            <Link to="/app/assistant">
              <MdAndroid /> Assistente IA
            </Link>
          </li>

          <li className={isActive("/app/tools")}>
            <Link to="/app/tools">
              <MdOutlineSettings /> Ferramentas
            </Link>
          </li>
        </ul>
      </div>

      {/* Área do Usuário no rodapé da Sidebar */}
      <div className="sidebar-footer">
        <div className="avatar">NU</div>
        <div className="user-info">
          <span className="user-name">nome usuário</span>
          <Link to="/app/profile" className="view-profile">Ver perfil</Link>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;