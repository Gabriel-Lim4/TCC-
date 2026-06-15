import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiHome, FiInstagram, FiTrendingUp, FiUsers } from "react-icons/fi";
import { FaTiktok } from "react-icons/fa";
import { SiGoogleads, SiMeta } from "react-icons/si";
import { MdOutlineSettings, MdAndroid } from "react-icons/md";
import logo from "../assets/Logo.png";
import "../styles/Sidebar.css";
import api from "../services/api";

function Sidebar() {
  const location = useLocation();
  const [usuario, setUsuario] = useState({ nome: '', email: '' });

  useEffect(() => {
    // Tenta pegar do localStorage primeiro (evita request extra)
    const cached = localStorage.getItem('usuario');
    if (cached) {
      const u = JSON.parse(cached);
      setUsuario({ nome: u.nome, email: u.email });
    }

    // Confirma com o backend
    api.get('/auth/me')
      .then(({ data }) => {
        const u = data.usuario;
        setUsuario({ nome: u.nome, email: u.email });
        localStorage.setItem('usuario', JSON.stringify(u));
      })
      .catch(() => {}); // silencia — se falhar, usa o cache
  }, []);

  const iniciais = usuario.nome
    ? usuario.nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : 'NU';

  const isActive = (path) => location.pathname === path ? "active-purple" : "";

  return (
    <aside className="sidebar">
      <div>
        <img src={logo} alt="Eyesight Logo" style={{ width: "50px", height: "50px", objectFit: "contain" }} />
        <h2>EYESIGHT</h2>
        <ul>
          <li className={isActive("/app")}>
            <Link to="/app"><FiHome /> Início</Link>
          </li>
          <li className={isActive("/app/tiktok")}>
            <Link to="/app/tiktok"><FaTiktok /> TikTok</Link>
          </li>
          <li className={isActive("/app/instagram")}>
            <Link to="/app/instagram"><FiInstagram /> Instagram</Link>
          </li>
          <li className={isActive("/app/google")}>
            <Link to="/app/google"><SiGoogleads /> Google Ads</Link>
          </li>
          <li className={isActive("/app/meta")}>
            <Link to="/app/meta"><SiMeta /> Meta Ads</Link>
          </li>
          <li className={isActive("/app/metrics")}>
            <Link to="/app/metrics"><FiTrendingUp /> Métricas</Link>
          </li>
          <li className={isActive("/app/account")}>
            <Link to="/app/account"><FiUsers /> Contas</Link>
          </li>
          <li className={isActive("/app/assistant")}>
            <Link to="/app/assistant"><MdAndroid /> Assistente IA</Link>
          </li>
          <li className={isActive("/app/tools")}>
            <Link to="/app/tools"><MdOutlineSettings /> Ferramentas</Link>
          </li>
        </ul>
      </div>

      <div className="sidebar-footer">
        <div className="avatar">{iniciais}</div>
        <div className="user-info">
          <span className="user-name">{usuario.nome || 'Carregando...'}</span>
          <Link to="/app/profile" className="view-profile">Ver perfil</Link>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
