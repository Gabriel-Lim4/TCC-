/* importando sistema de rotas */
import { Routes, Route } from "react-router-dom";

/* importando layouts e páginas */
import Home from "./pages/Home";
import Layout from "./pages/Layout";
import TikTok from "./pages/Tiktok";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Instagram from "./pages/Instagram";
import Google from "./pages/Google";
import Meta from "./pages/Meta";
import Metrics from "./pages/Metrics";
import Accounts from "./pages/Accounts";
import Assistant from "./pages/Assistant";
import Tools from "./pages/Tools";

// Função para jogar o scroll pro topo
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (

    /* definição das rotas */
      <Routes>
      {/* tela inicial do Home*/}
      <Route path="/" element={<Home />} />

      {/* tela de login */}
      <Route path="/login" element={<Login />} />

      {/* rota de cadastro */}
      <Route path="/cadastro" element={<Cadastro />} />

      {/* sistema principal */}
      <Route path="/app" element={<Layout />}>

        {/* dashboard padrão */}
        <Route index element={<Dashboard />} />

        {/* rota dashboard */}
        <Route path="dashboard" element={<Dashboard />} />

        {/* rota tiktok */}
        <Route path="tiktok" element={<TikTok />} />

        {/* rota instagram */}
        <Route path="instagram" element={<Instagram />} />

        {/* rota google ads */}
        <Route path="google" element={<Google />} />

        {/* rota meta ads */}
        <Route path="meta" element={<Meta />} />

        {/* rota métricas*/}
        <Route path="metrics" element={<Metrics />} />

        {/* rota Contas*/}
        <Route path="accounts" element={<Accounts />} />

        {/* rota Ferramentas*/}
        <Route path="tools" element={<Tools />} />

        {/* rota Assistente IA*/}
        <Route path="assistant" element={<Assistant />} />
      </Route>
    </Routes>
  );
}

/* exportando componente principal */
export default App;

/* cria um novo projeto React (estrutura inicial)
  -> npm create vite@latest */

/* entra na pasta do projeto que você criou
-> cd nome-do-projeto */

/* instala todas as dependências (bibliotecas necessárias)
-> npm install */

/* inicia o projeto (abre no navegador)
-> npm run dev */

/* instala biblioteca de ícones para usar no projeto
-> npm install react-icons */

/* para o servidor (encerra o projeto rodando)
-> Ctrl + C*/

/* inicia de novo o projeto
-> npm run dev*/

/* Instala a Rotas
-> npm install react-router-dom*/

/* PowerShell
-> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned */

/* ou PowerShell
-> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned - Force*/

/*Instalar Axios no Backend
Dentro da pasta Backend:
-> npm install axios dotenv express cors*/

/* npm install axios */

/*npm install lucide-react */

/*unDraw
Storyset
Freepik
Blush */

/*npm install lottie-react */
