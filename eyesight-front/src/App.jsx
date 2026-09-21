/* importando sistema de rotas */
import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

/* importando layouts e páginas */
import Home from "./pages/Home";
import Layout from "./pages/Layout";
//import TikTok from "./pages/Tiktok";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Instagram from "./pages/Instagram";
import Google from "./pages/Google";
import Meta from "./pages/Meta";
import Metrics from "./pages/Metrics";
import Account from "./pages/Account";
import Assistant from "./pages/Assistant";
//import Tools from "./pages/Tools";
import Profile from "./pages/Profile";
import CustomCursor from "./components/CustomCursor";
import ForgotPassword from "./pages/ForgotPassword";
import VerificarEmail from "./pages/VerificarEmail";
import RedefinirSenha from "./pages/RedefinirSenha";

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
    <>
      <CustomCursor />
      <ScrollToTop />

      {/* definição das rotas */}
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

          {/* rota tiktok 
          <Route path="tiktok" element={<TikTok />} />*/}

          {/* rota instagram */}
          <Route path="instagram" element={<Instagram />} />

          {/* rota google ads */}
          <Route path="google" element={<Google />} />

          {/* rota meta ads */}
          <Route path="meta" element={<Meta />} />

          {/* rota métricas*/}
          <Route path="metrics" element={<Metrics />} />

          {/* rota Contas*/}
          <Route path="account" element={<Account />} />

          {/* rota Ferramentas
          <Route path="tools" element={<Tools />} />*/}

          {/* rota Assistente IA*/}
          <Route path="assistant" element={<Assistant />} />

          {/* rota Perfil Usúario*/}
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* redefinição de senha */}
        <Route path="/esqueci-senha" element={<ForgotPassword />} />

        {/* confirmação de e-mail */}
        <Route path="/verificar-email" element={<VerificarEmail />} />

        {/* nova senha (link do e-mail) */}
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />

      </Routes>
    </>
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
/*npm install recharts*/

/*unDraw
Storyset
Freepik
Blush */

/*npm install lottie-react */
