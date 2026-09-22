import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

/* Importando ícones super tradicionais e seguros do react-icons */
import { FiHome, FiInstagram, FiTrendingUp, FiUsers } from "react-icons/fi";
import { FaTiktok } from "react-icons/fa";
import { SiGoogleads } from "react-icons/si";
import { MdOutlineDoubleArrow, MdOutlineSettings, MdAndroid } from "react-icons/md";
import logo from "../assets/Logo.png";
import "../styles/Sidebar.css";
import "../styles/Dashboard.css";





function Sidebar() {
  const location = useLocation();

  // Estado de recolhida/expandida, lembrado entre recarregamentos da página
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("eyesight-sidebar-collapsed") === "1"
  );

  useEffect(() => {
    localStorage.setItem("eyesight-sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Função para verificar a página ativa
  const isActive = (path) => (location.pathname === path ? "active-purple" : "");

  // Clicar na logo só expande (não faz sentido recolher clicando nela)
  const handleBrandClick = () => {
    if (collapsed) setCollapsed(false);
  };

  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      {/* Alça para recolher/expandir a sidebar */}
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setCollapsed((prev) => !prev)}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        title={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        <MdOutlineDoubleArrow />
      </button>

      <div>
        <div
          className="sidebar-brand"
          onClick={handleBrandClick}
          role="button"
          tabIndex={collapsed ? 0 : -1}
          aria-label={collapsed ? "Expandir menu" : undefined}
        >
          <div className="sidebar-logo-ring">
            <img src={logo} alt="Eyesight Logo" className="sidebar-logo" />
          </div>
          {/* Titulo do sistema */}
          <h2>EYESIGHT</h2>
        </div>

        <ul>
          <li className={isActive("/app")} title={collapsed ? "Início" : undefined}>
            <Link to="/app">
              <FiHome /> <span className="link-text">Início</span>
            </Link>
          </li>

          <li className={isActive("/app/instagram")} title={collapsed ? "Instagram" : undefined}>
            <Link to="/app/instagram">
              <FiInstagram /> <span className="link-text">Instagram</span>
            </Link>
          </li>

          <li className={isActive("/app/google")} title={collapsed ? "Google Ads" : undefined}>
            <Link to="/app/google">
              <SiGoogleads /> <span className="link-text">Google Ads</span>
            </Link>
          </li>

          <li className={isActive("/app/meta")} title={collapsed ? "Meta Ads" : undefined}>
            <Link to="/app/meta">
              {/* Usando o do Google provisoriamente para testar se a tela volta */}
              <SiGoogleads /> <span className="link-text">Meta Ads</span>
            </Link>
          </li>

          <li className={isActive("/app/metrics")} title={collapsed ? "Métricas" : undefined}>
            <Link to="/app/metrics">
              <FiTrendingUp /> <span className="link-text">Métricas</span>
            </Link>
          </li>

          <li className={isActive("/app/account")} title={collapsed ? "Contas" : undefined}>
            <Link to="/app/account">
              <FiUsers /> <span className="link-text">Contas</span>
            </Link>
          </li>

          <li className={isActive("/app/assistant")} title={collapsed ? "Assistente IA" : undefined}>
            <Link to="/app/assistant">
              <MdAndroid /> <span className="link-text">Assistente IA</span>
            </Link>
          </li>

        
        </ul>
      </div>

      {/* Área do Usuário no rodapé da Sidebar */}
      <div className="sidebar-footer" title={collapsed ? "nome usuário" : undefined}>
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