import { useState, useEffect, useMemo } from "react";
import "../styles/Profile.css";
import "../styles/variables.css";
import md5 from "../utils/md5";
import {
  User, Shield, Bell, CreditCard, Edit, Check, X,
  Lock, Smartphone, LogOut, ShieldCheck, ShieldAlert, BellRing, Sparkles,
  Link2, Megaphone, FileBarChart2, CalendarDays, BadgeCheck,
  Eye, EyeOff, Info,
} from "lucide-react";

const TABS = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "seguranca", label: "Segurança", icon: Shield },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "plano", label: "Plano", icon: CreditCard },
];

const PLANOS = [
  {
    id: "free",
    nome: "Free",
    preco: "R$ 0/mês",
    recursos: ["1 plataforma conectada", "Métricas básicas", "Suporte por e-mail"],
  },
  {
    id: "pro",
    nome: "Pro",
    preco: "R$ 49/mês",
    recursos: ["Até 5 plataformas", "Assistente com IA", "Relatórios semanais", "Suporte prioritário"],
    recomendado: true,
  },
  {
    id: "business",
    nome: "Business",
    preco: "R$ 149/mês",
    recursos: ["Plataformas ilimitadas", "Múltiplos usuários", "Exportação de dados", "Gerente de conta"],
  },
];

// cor de identidade de cada rede, usada só como um pequeno indicador visual
const SOCIAL_COLORS = {
  tiktok: "#00f2ea",
  instagram: "#e1306c",
  twitter: "#60a5fa",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRENGTH_LABELS = ["Muito fraca", "Fraca", "Razoável", "Forte", "Muito forte"];
const STRENGTH_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];

function getInitials(nome) {
  const partes = nome.trim().split(/\s+/).slice(0, 2);
  const iniciais = partes.map((p) => p[0]?.toUpperCase()).join("");
  return iniciais || "?";
}

function getPasswordStrength(senha) {
  if (!senha) return 0;
  let score = 0;
  if (senha.length >= 8) score += 1;
  if (senha.length >= 12) score += 1;
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) score += 1;
  if (/\d/.test(senha)) score += 1;
  if (/[^A-Za-z0-9]/.test(senha)) score += 1;
  return Math.min(score, 4);
}

// mascara todos os dígitos exceto os 4 últimos, ex: +55 (11) 9••••-9999
function maskPhone(tel) {
  return tel.replace(/\d(?=\d{4})/g, "•");
}

// pequeno modal de confirmação reutilizável para ações sensíveis
function ConfirmModal({ config, onCancel }) {
  if (!config) return null;
  const { title, description, confirmLabel = "Confirmar", danger = false, onConfirm } = config;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-icon ${danger ? "danger" : "neutral"}`}>
          {danger ? <ShieldAlert size={20} /> : <Info size={20} />}
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className={`modal-confirm ${danger ? "danger" : "neutral"}`}
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Profile() {
  const [activeTab, setActiveTab] = useState("perfil");
  const [isEditing, setIsEditing] = useState(false);

  // --- Confirmação de ações sensíveis ---
  const [confirmState, setConfirmState] = useState(null);
  const openConfirm = (config) => setConfirmState(config);
  const closeConfirm = () => setConfirmState(null);

  // --- Dados pessoais ---
  const [formData, setFormData] = useState({
    nome: "Nome Usuário",
    email: "usuario@email.com",
    telefone: "+55 (11) 99999-9999",
    localizacao: "São Paulo, Brasil",
  });
  const [draftData, setDraftData] = useState(formData);
  const [formErrors, setFormErrors] = useState({});
  const [profileMsg, setProfileMsg] = useState(null);
  const [phoneVisible, setPhoneVisible] = useState(false);

  const startEditing = () => {
    setDraftData(formData);
    setFormErrors({});
    setProfileMsg(null);
    setIsEditing(true);
    setActiveTab("perfil");
  };

  const saveEditing = () => {
    const errors = {};
    if (!draftData.nome.trim()) errors.nome = "Informe seu nome completo.";
    if (!EMAIL_REGEX.test(draftData.email.trim())) errors.email = "Informe um e-mail válido.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setFormData(draftData);
    setIsEditing(false);
    setProfileMsg({ tipo: "sucesso", texto: "Alterações salvas com sucesso." });
  };

  const cancelEditing = () => {
    setDraftData(formData);
    setFormErrors({});
    setIsEditing(false);
  };

  const handleDraftChange = (field, value) => {
    setDraftData((prev) => ({ ...prev, [field]: value }));
  };

  // --- Avatar vinculado ao e-mail (Gravatar) ---
  // a foto muda automaticamente conforme o e-mail — inclusive em tempo real
  // durante a edição, para o usuário ver a prévia antes de salvar.
  const [avatarOk, setAvatarOk] = useState(true);
  const emailParaAvatar = (isEditing ? draftData.email : formData.email).trim().toLowerCase();
  const avatarHash = useMemo(() => md5(emailParaAvatar), [emailParaAvatar]);
  const avatarUrl = `https://www.gravatar.com/avatar/${avatarHash}?s=200&d=identicon`;

  useEffect(() => {
    setAvatarOk(true);
  }, [avatarUrl]);

  // --- Redes conectadas ---
  const [social, setSocial] = useState({
    tiktok: { nome: "TikTok", handle: "@nomeusuario", conectado: true },
    instagram: { nome: "Instagram", handle: "@nomeusuario", conectado: true },
    twitter: { nome: "Twitter/X", handle: "@nomeusuario", conectado: false },
  });

  const toggleSocial = (key) => {
    setSocial((prev) => ({
      ...prev,
      [key]: { ...prev[key], conectado: !prev[key].conectado },
    }));
  };

  // --- Segurança ---
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [senhaMsg, setSenhaMsg] = useState(null);
  const [twoFA, setTwoFA] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({
    atual: false,
    nova: false,
    confirmar: false,
  });

  const toggleVisible = (campo) => {
    setVisiblePasswords((prev) => ({ ...prev, [campo]: !prev[campo] }));
  };

  const [sessoes, setSessoes] = useState([
    { id: 1, dispositivo: "Chrome · Windows", local: "São Paulo, Brasil", atual: true },
    { id: 2, dispositivo: "App · iPhone 14", local: "São Paulo, Brasil", atual: false },
  ]);

  const novaSenhaForca = getPasswordStrength(novaSenha);

  const handleAlterarSenha = (e) => {
    e.preventDefault();

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setSenhaMsg({ tipo: "erro", texto: "Preencha todos os campos." });
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setSenhaMsg({ tipo: "erro", texto: "As senhas não coincidem." });
      return;
    }
    if (novaSenhaForca < 2) {
      setSenhaMsg({ tipo: "erro", texto: "Escolha uma senha mais forte antes de continuar." });
      return;
    }

    setSenhaMsg({ tipo: "sucesso", texto: "Senha atualizada com sucesso." });
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
  };

  const encerrarSessao = (id) => {
    setSessoes((prev) => prev.filter((s) => s.id !== id));
  };

  const requestEncerrarSessao = (id, dispositivo) => {
    openConfirm({
      title: "Encerrar sessão?",
      description: `O dispositivo "${dispositivo}" vai precisar fazer login novamente para acessar sua conta.`,
      confirmLabel: "Encerrar sessão",
      danger: true,
      onConfirm: () => encerrarSessao(id),
    });
  };

  const requestEncerrarTodas = () => {
    openConfirm({
      title: "Encerrar todas as outras sessões?",
      description: "Todos os outros dispositivos conectados à sua conta serão desconectados imediatamente.",
      confirmLabel: "Encerrar todas",
      danger: true,
      onConfirm: () => setSessoes((prev) => prev.filter((s) => s.atual)),
    });
  };

  const handleToggle2FA = () => {
    if (twoFA) {
      openConfirm({
        title: "Desativar verificação em duas etapas?",
        description:
          "Sua conta passará a ser protegida apenas pela senha. Recomendamos manter essa camada extra de segurança ativada.",
        confirmLabel: "Desativar mesmo assim",
        danger: true,
        onConfirm: () => setTwoFA(false),
      });
    } else {
      setTwoFA(true);
    }
  };

  // --- Notificações ---
  const [notificacoes, setNotificacoes] = useState({
    metricas: { label: "Novas métricas disponíveis", ativo: true },
    relatorioSemanal: { label: "Relatório semanal por e-mail", ativo: true },
    quedaDesempenho: { label: "Alertas de queda de desempenho", ativo: true },
    novidades: { label: "Novidades e atualizações do Eyesight", ativo: false },
  });

  const toggleNotificacao = (key) => {
    setNotificacoes((prev) => ({
      ...prev,
      [key]: { ...prev[key], ativo: !prev[key].ativo },
    }));
  };

  // --- Plano ---
  const [planoAtual, setPlanoAtual] = useState("pro");

  const handleSelectPlano = (novoPlanoId) => {
    const idxAtual = PLANOS.findIndex((p) => p.id === planoAtual);
    const idxNovo = PLANOS.findIndex((p) => p.id === novoPlanoId);
    const novoPlano = PLANOS[idxNovo];

    if (idxNovo < idxAtual) {
      openConfirm({
        title: `Mudar para o plano ${novoPlano.nome}?`,
        description: "Você perde acesso aos recursos exclusivos do seu plano atual imediatamente após a troca.",
        confirmLabel: "Confirmar mudança",
        danger: true,
        onConfirm: () => setPlanoAtual(novoPlanoId),
      });
    } else {
      setPlanoAtual(novoPlanoId);
    }
  };

  const contasConectadas = Object.values(social).filter((s) => s.conectado).length;

  return (
    <div className="profile-page">
      {/* camada decorativa de fundo, na mesma linguagem visual do resto do app */}
      <div className="profile-bg-mesh" aria-hidden="true" />

      <div className="profile-header">
        <div>
          <span className="profile-eyebrow">
            <Sparkles size={13} /> Minha Conta
          </span>
          <h1>Meu Perfil</h1>
          <p>Gerencie suas informações pessoais e preferências da conta</p>
        </div>

        <span className="profile-verified-pill">
          <BadgeCheck size={15} /> Conta verificada
        </span>
      </div>

      <div className="profile-card">

        <div className="profile-top">

          <div className="profile-user">

            <div className="avatar-ring">
              <div className="avatar">
                {avatarOk ? (
                  <img
                    src={avatarUrl}
                    alt={`Foto de perfil de ${formData.nome}`}
                    onError={() => setAvatarOk(false)}
                  />
                ) : (
                  <span>{getInitials(formData.nome)}</span>
                )}
              </div>
              <span className="avatar-status" title="Online" />
            </div>

            <div className="user-info">
              <h2>{formData.nome}</h2>
              <p>{formData.email}</p>

              <div className="badges">
                <span className="badge pro">
                  <Sparkles size={12} /> {PLANOS.find((p) => p.id === planoAtual)?.nome}
                </span>
                <span className="badge verified">
                  <ShieldCheck size={12} /> Verificado
                </span>
              </div>
            </div>

          </div>

          <button className="edit-btn" onClick={startEditing}>
            <Edit size={16} />
            Editar perfil
          </button>

        </div>

        <div className="profile-stats">

          <div className="stat">
            <div className="stat-icon"><Link2 size={16} /></div>
            <div>
              <h3 className="mono-num">{contasConectadas}</h3>
              <span>Contas conectadas</span>
            </div>
          </div>

          <div className="stat">
            <div className="stat-icon"><Megaphone size={16} /></div>
            <div>
              <h3 className="mono-num">12</h3>
              <span>Campanhas ativas</span>
            </div>
          </div>

          <div className="stat">
            <div className="stat-icon"><FileBarChart2 size={16} /></div>
            <div>
              <h3 className="mono-num">87</h3>
              <span>Relatórios gerados</span>
            </div>
          </div>

          <div className="stat">
            <div className="stat-icon"><CalendarDays size={16} /></div>
            <div>
              <h3 className="mono-num">Jan 2025</h3>
              <span>Membro desde</span>
            </div>
          </div>

        </div>

      </div>

      <div className="profile-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={activeTab === id ? "active" : ""}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* ================= ABA: PERFIL ================= */}
      {activeTab === "perfil" && (
        <div className="profile-content">

          <div className="personal-info">
            <h2>Informações Pessoais</h2>

            {profileMsg && (
              <p className={`senha-msg ${profileMsg.tipo}`}>{profileMsg.texto}</p>
            )}

            <div className="form-grid">
              <div className="input-group">
                <label>Nome completo</label>
                <input
                  type="text"
                  className={formErrors.nome ? "has-error" : ""}
                  value={isEditing ? draftData.nome : formData.nome}
                  readOnly={!isEditing}
                  onChange={(e) => handleDraftChange("nome", e.target.value)}
                />
                {formErrors.nome && <span className="field-error">{formErrors.nome}</span>}
              </div>

              <div className="input-group">
                <label>E-mail</label>
                <input
                  type="email"
                  className={formErrors.email ? "has-error" : ""}
                  value={isEditing ? draftData.email : formData.email}
                  readOnly={!isEditing}
                  onChange={(e) => handleDraftChange("email", e.target.value)}
                />
                {isEditing && !formErrors.email && (
                  <span className="field-hint">
                    Sua foto de perfil é vinculada automaticamente a este e-mail.
                  </span>
                )}
                {formErrors.email && <span className="field-error">{formErrors.email}</span>}
              </div>

              <div className="input-group">
                <label>Telefone</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={draftData.telefone}
                    onChange={(e) => handleDraftChange("telefone", e.target.value)}
                  />
                ) : (
                  <div className="phone-row">
                    <input
                      type="text"
                      value={phoneVisible ? formData.telefone : maskPhone(formData.telefone)}
                      readOnly
                    />
                    <button
                      type="button"
                      className="reveal-btn"
                      onClick={() => setPhoneVisible((v) => !v)}
                    >
                      {phoneVisible ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                )}
              </div>

              <div className="input-group">
                <label>Localização</label>
                <input
                  type="text"
                  value={isEditing ? draftData.localizacao : formData.localizacao}
                  readOnly={!isEditing}
                  onChange={(e) => handleDraftChange("localizacao", e.target.value)}
                />
              </div>

            </div>

            {isEditing && (
              <div className="edit-actions">
                <button className="save-btn" onClick={saveEditing}>
                  <Check size={16} /> Salvar alterações
                </button>
                <button className="cancel-btn" onClick={cancelEditing}>
                  <X size={16} /> Cancelar
                </button>
              </div>
            )}
          </div>

          <div className="social-card">
            <h2>Redes Conectadas</h2>

            {Object.entries(social).map(([key, item]) => (
              <div className="social-item" key={key}>
                <div className="social-item-info">
                  <span className="social-dot" style={{ background: SOCIAL_COLORS[key] }} />
                  <div>
                    <strong>{item.nome}</strong>
                    <p>{item.handle}</p>
                  </div>
                </div>

                {item.conectado ? (
                  <span className="connected" onClick={() => toggleSocial(key)}>
                    Conectado
                  </span>
                ) : (
                  <button className="connect-btn" onClick={() => toggleSocial(key)}>
                    Conectar
                  </button>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ================= ABA: SEGURANÇA ================= */}
      {activeTab === "seguranca" && (
        <div className="profile-content">

          <div className="personal-info">
            <div className="security-banner">
              <ShieldCheck size={18} />
              <p>
                Seus dados de acesso são criptografados e nunca compartilhados. Recomendamos usar uma
                senha única para esta conta e manter a verificação em duas etapas ativada.
              </p>
            </div>

            <h2>Alterar senha</h2>

            {senhaMsg && (
              <p className={`senha-msg ${senhaMsg.tipo}`}>{senhaMsg.texto}</p>
            )}

            <form className="form-grid" onSubmit={handleAlterarSenha}>
              <div className="input-group input-group-full">
                <label>Senha atual</label>
                <div className="password-field">
                  <input
                    type={visiblePasswords.atual ? "text" : "password"}
                    placeholder="••••••••"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => toggleVisible("atual")}
                    aria-label={visiblePasswords.atual ? "Ocultar senha atual" : "Mostrar senha atual"}
                  >
                    {visiblePasswords.atual ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Nova senha</label>
                <div className="password-field">
                  <input
                    type={visiblePasswords.nova ? "text" : "password"}
                    placeholder="••••••••"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => toggleVisible("nova")}
                    aria-label={visiblePasswords.nova ? "Ocultar nova senha" : "Mostrar nova senha"}
                  >
                    {visiblePasswords.nova ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {novaSenha && (
                  <div className="strength-meter">
                    <div className="strength-track">
                      <div
                        className="strength-fill"
                        style={{
                          width: `${(novaSenhaForca / 4) * 100}%`,
                          background: STRENGTH_COLORS[novaSenhaForca],
                        }}
                      />
                    </div>
                    <span style={{ color: STRENGTH_COLORS[novaSenhaForca] }}>
                      {STRENGTH_LABELS[novaSenhaForca]}
                    </span>
                  </div>
                )}
              </div>

              <div className="input-group">
                <label>Confirmar nova senha</label>
                <div className="password-field">
                  <input
                    type={visiblePasswords.confirmar ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => toggleVisible("confirmar")}
                    aria-label={visiblePasswords.confirmar ? "Ocultar confirmação" : "Mostrar confirmação"}
                  >
                    {visiblePasswords.confirmar ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="input-group input-group-full">
                <button type="submit" className="save-btn">
                  <Lock size={16} /> Atualizar senha
                </button>
                <span className="field-hint">
                  Use ao menos 8 caracteres, misturando letras, números e símbolos.
                </span>
              </div>
            </form>
          </div>

          <div className="social-card">
            <h2>Verificação em duas etapas</h2>

            <div className="twofa-row">
              <div>
                <strong>Autenticação em duas etapas</strong>
                <p>{twoFA ? "Ativada — sua conta está mais protegida." : "Desativada."}</p>
              </div>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={twoFA}
                  onChange={handleToggle2FA}
                />
                <span className="switch-track" />
              </label>
            </div>

            <div className="sessions-header">
              <h2 className="sessions-title">Sessões ativas</h2>
              {sessoes.some((s) => !s.atual) && (
                <button className="text-btn-danger" onClick={requestEncerrarTodas}>
                  <LogOut size={14} /> Encerrar outras sessões
                </button>
              )}
            </div>

            {sessoes.map((s) => (
              <div className="session-item" key={s.id}>
                <div className="session-icon">
                  <Smartphone size={16} />
                </div>
                <div>
                  <strong>{s.dispositivo}</strong>
                  <p>{s.local}</p>
                </div>
                {s.atual ? (
                  <span className="connected">Sessão atual</span>
                ) : (
                  <button className="connect-btn" onClick={() => requestEncerrarSessao(s.id, s.dispositivo)}>
                    <LogOut size={14} /> Encerrar
                  </button>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ================= ABA: NOTIFICAÇÕES ================= */}
      {activeTab === "notificacoes" && (
        <div className="profile-content profile-content-single">
          <div className="personal-info">
            <h2>Preferências de notificação</h2>
            <p className="section-subtitle">
              Escolha o que você quer receber por e-mail e dentro do sistema.
            </p>

            {Object.entries(notificacoes).map(([key, item]) => (
              <div className="twofa-row" key={key}>
                <div className="notif-icon">
                  <BellRing size={16} />
                </div>
                <div className="notif-label">
                  <strong>{item.label}</strong>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={item.ativo}
                    onChange={() => toggleNotificacao(key)}
                  />
                  <span className="switch-track" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= ABA: PLANO ================= */}
      {activeTab === "plano" && (
        <div className="profile-content profile-content-single">
          <div className="personal-info">
            <h2>Seu plano</h2>
            <p className="section-subtitle">
              Você está no plano{" "}
              <strong>{PLANOS.find((p) => p.id === planoAtual)?.nome}</strong>.
              Compare as opções abaixo e mude quando quiser.
            </p>

            <div className="plans-grid">
              {PLANOS.map((plano) => {
                const isAtual = plano.id === planoAtual;
                return (
                  <div className={`plan-card ${isAtual ? "plan-current" : ""}`} key={plano.id}>
                    {isAtual && (
                      <span className="plan-tag">
                        <Sparkles size={12} /> Plano atual
                      </span>
                    )}
                    {!isAtual && plano.recomendado && (
                      <span className="plan-tag plan-tag-recommended">
                        <Sparkles size={12} /> Mais popular
                      </span>
                    )}
                    <h3>{plano.nome}</h3>
                    <p className="plan-price mono-num">{plano.preco}</p>

                    <ul className="plan-features">
                      {plano.recursos.map((r) => (
                        <li key={r}>
                          <ShieldCheck size={14} /> {r}
                        </li>
                      ))}
                    </ul>

                    <button
                      className={isAtual ? "connect-btn" : "save-btn"}
                      disabled={isAtual}
                      onClick={() => handleSelectPlano(plano.id)}
                    >
                      {isAtual ? "Plano atual" : "Selecionar plano"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal config={confirmState} onCancel={closeConfirm} />

    </div>
  );
}

export default Profile;