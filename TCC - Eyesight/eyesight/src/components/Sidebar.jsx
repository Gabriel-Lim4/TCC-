/* importando navegação */
import { Link } from "react-router-dom";

/* importando ícones */
import { FaTiktok, FaInstagram } from "react-icons/fa";
import { SiGoogleads } from "react-icons/si";
import { MdHome } from "react-icons/md";
import { RiAccountCircleFill } from "react-icons/ri";
import { PiChartLineBold } from "react-icons/pi";
import { AiOutlineTool } from "react-icons/ai";

function Sidebar() {
  return (

    /* menu lateral */
    <aside className="sidebar">

      {/* titulo do sistema */}
      <h2>EYESIGHT</h2>

      <ul>

        <li>

          {/* link da página inicial */}
          <Link to="/app">
            <MdHome /> Início
          </Link>

        </li>

        <li>

          {/* link do tiktok */}
          <Link to="/app/tiktok">
            <FaTiktok /> TikTok
          </Link>

        </li>

        <li>

          {/* link do instagram */}
          <Link to="/app/instagram">
            <FaInstagram /> Instagram
          </Link>

        </li>

        <li>

          {/* link do google ads */}
          <Link to="/app/google">
            <SiGoogleads /> Google Ads
          </Link>

        </li>

        <li>

          {/* link do meta ads */}
          <Link to="/app/meta">
            <SiGoogleads /> Meta Ads
          </Link>

        </li>

        <li>

          {/* link das métricas */}
          <Link to="/app/metrics">
            <PiChartLineBold /> Métricas
          </Link>

        </li>

        <li>

          {/* link das contas */}
          <Link to="/app/accounts">
            <RiAccountCircleFill /> Contas
          </Link>

        </li>

        {/* área do assistente ia */}
        <li>
        <Link to="/app/assistant">
          <RiAccountCircleFill /> Assistente IA
        </Link>
        </li>

        <li>

          {/* link das ferramentas */}
          <Link to="/ferramentas">
            <AiOutlineTool /> Ferramentas
          </Link>

        </li>

      </ul>

    </aside>
  );
}

/* exportando componente */
export default Sidebar;