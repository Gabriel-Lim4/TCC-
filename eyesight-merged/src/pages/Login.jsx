import '../styles/Login.css';
import { useState }    from 'react';
import logo            from '../assets/Logo.png';
import { useNavigate } from 'react-router-dom';
import api             from '../services/api';

function Login() {
  const navigate = useNavigate();
  const [isCadastro, setIsCadastro] = useState(false);

  const [nome, setNome]                     = useState('');
  const [email, setEmail]                   = useState('');
  const [senha, setSenha]                   = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro]                     = useState('');
  const [sucesso, setSucesso]               = useState('');
  const [loading, setLoading]               = useState(false);

  async function handleLogin() {
    setErro('');
    if (!email || !senha) { setErro('Preencha e-mail e senha.'); return; }

    try {
      setLoading(true);
      const { data } = await api.post('/auth/login', { email, senha });

      if (data.token) {
        localStorage.setItem('token', data.token);
        // Necessário para o callback OAuth do Meta identificar o usuário
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
      }

      navigate('/app/dashboard');
    } catch (err) {
      setErro(err.response?.data?.erro || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCadastro() {
    setErro('');
    if (!nome || !email || !senha || !confirmarSenha) {
      setErro('Preencha todos os campos.'); return;
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.'); return;
    }

    try {
      setLoading(true);
      await api.post('/auth/cadastro', { nome, email, senha });
      setIsCadastro(false);
      setNome('');
      setSenha('');
      setConfirmarSenha('');
      setErro('');
      setTimeout(() => setSucesso('Cadastro realizado! Faça login para continuar.'), 0);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao cadastrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function trocarModo(paraCadastro) {
    setErro(''); setSucesso('');
    setNome(''); setSenha(''); setConfirmarSenha('');
    setIsCadastro(paraCadastro);
  }

  return (
    <div className={`login-container ${isCadastro ? 'cadastro-mode' : ''}`}>

      <div className="left-side">
        <div className="login-header">
          <div className="logo-box">
            <img src={logo} alt="logo" />
          </div>
          <h1>EYESIGHT</h1>
          <p>Marketing Metrics</p>
        </div>
      </div>

      <div className="right-side">
        <div className="login-box">
          <h2>{isCadastro ? 'Cadastrar' : 'Entrar'}</h2>

          {erro    && <p className="erro-msg">{erro}</p>}
          {sucesso && <p className="erro-msg" style={{ color: '#68d391' }}>{sucesso}</p>}

          {isCadastro && (
            <>
              <label>Nome</label>
              <input type="text" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </>
          )}

          <label>E-mail</label>
          <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label>Senha</label>
          <input type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} />

          {isCadastro && (
            <>
              <label>Confirmar Senha</label>
              <input type="password" placeholder="••••••••" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} />
            </>
          )}

          {!isCadastro && <span className="forgot">Esqueceu a senha?</span>}

          <button className="btn-login" disabled={loading} onClick={isCadastro ? handleCadastro : handleLogin}>
            {loading ? 'Aguarde...' : isCadastro ? 'Cadastrar' : 'Entrar →'}
          </button>

          <div className="divider"><span>ou</span></div>

          {!isCadastro ? (
            <p className="register">Não tem uma conta? <span onClick={() => trocarModo(true)}>Cadastre-se</span></p>
          ) : (
            <p className="register">Já possui conta? <span onClick={() => trocarModo(false)}>Entrar</span></p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
