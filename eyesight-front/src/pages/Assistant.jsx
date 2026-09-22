import React, { useState, useEffect, useRef } from "react";
import "../styles/Assistant.css";
import {
  Sparkles, Send, TrendingUp, Lightbulb, MessageSquare, Zap, Clock, Bot, Plus,
} from "lucide-react";
import "../styles/variables.css";

const SUGESTOES_RAPIDAS = [
  "Analisar meu CTR da semana",
  "Ideias de criativo para Reels",
  "Como reduzir meu CAC?",
];

const MENSAGEM_BOAS_VINDAS = {
  id: "welcome",
  sender: "ai",
  time: "09:12",
  text: "Olá! Sou seu assistente de IA focado em métricas de marketing. Como posso ajudar você hoje? Posso analisar suas campanhas, sugerir otimizações de ROAS ou gerar insights de conteúdo.",
};

// histórico de conversas anteriores — cada uma guarda a conversa completa,
// então o usuário consegue reabrir e continuar de onde parou.
const HISTORICO_CONVERSAS = [
  {
    id: "roas",
    titulo: "Como melhorar meu ROAS?",
    label: "Hoje",
    resumo: "Análise focada em escala de orçamento no Facebook Ads...",
    mensagens: [
      {
        id: "roas-1",
        sender: "user",
        time: "08:41",
        text: "Meu ROAS caiu de 4.2 pra 2.8 nas últimas duas semanas no Facebook Ads. O que pode estar acontecendo?",
      },
      {
        id: "roas-2",
        sender: "ai",
        time: "08:42",
        text: "Uma queda dessa magnitude geralmente combina dois fatores: fadiga de criativo e leilão mais concorrido. Olhando o padrão do seu nicho:",
        bullets: [
          "Frequência acima de 3.5 costuma derrubar o CTR e encarecer o CPM — vale checar esse número no Gerenciador de Anúncios.",
          "Se o público está saturado, testar um Lookalike 1-3% mais recente tende a recuperar parte da eficiência.",
          "Vale também revisar se o orçamento foi escalado rápido demais — aumentos acima de 20% ao dia reiniciam o aprendizado do algoritmo.",
        ],
      },
      {
        id: "roas-3",
        sender: "user",
        time: "08:44",
        text: "Faz sentido, escalei o orçamento em 50% de uma vez na semana passada.",
      },
      {
        id: "roas-4",
        sender: "ai",
        time: "08:45",
        text: "Aí está boa parte da resposta. Recomendo voltar ao orçamento anterior por 2-3 dias para estabilizar o aprendizado e depois escalar em incrementos de 15-20% a cada 48h, sempre acompanhando o CPA antes do próximo aumento.",
      },
    ],
  },
  {
    id: "tiktok-ideias",
    titulo: "Ideias de conteúdo para TikTok",
    label: "Ontem",
    resumo: "Sugestões de ganchos para vídeos curtos com foco em conversão...",
    mensagens: [
      {
        id: "tiktok-1",
        sender: "user",
        time: "14:02",
        text: "Preciso de ideias de gancho para vídeos de TikTok Shop, público de 18-24 anos.",
      },
      {
        id: "tiktok-2",
        sender: "ai",
        time: "14:03",
        text: "Para esse público, ganchos que criam curiosidade ou contraste nos primeiros 2 segundos performam melhor. Algumas direções:",
        bullets: [
          "\"Eu não ia comprar isso, mas depois de testar...\" — formato depoimento com virada.",
          "Comparação rápida lado a lado do produto com uma alternativa mais cara.",
          "Mostrar o problema primeiro (ex: dor, dificuldade) antes de revelar o produto como solução.",
        ],
      },
      {
        id: "tiktok-3",
        sender: "user",
        time: "14:05",
        text: "Gostei do formato depoimento, dá pra usar em qual duração?",
      },
      {
        id: "tiktok-4",
        sender: "ai",
        time: "14:06",
        text: "Entre 18 e 25 segundos costuma funcionar bem para esse formato: 3s de gancho, 10-15s mostrando o uso real do produto, e o fechamento com CTA claro nos últimos segundos.",
      },
    ],
  },
  {
    id: "ctr-queda",
    titulo: "Queda no CTR da campanha",
    label: "3 dias",
    resumo: "Diagnóstico de criativos com baixa performance e plano de teste A/B...",
    mensagens: [
      {
        id: "ctr-1",
        sender: "user",
        time: "11:20",
        text: "O CTR da minha campanha principal caiu de 2.1% para 1.3% essa semana. Já é fadiga de criativo?",
      },
      {
        id: "ctr-2",
        sender: "ai",
        time: "11:21",
        text: "É o suspeito mais provável nesse cenário. Antes de trocar o criativo, vale confirmar alguns pontos:",
        bullets: [
          "Verifique a frequência média — acima de 3 já é sinal de saturação do público atual.",
          "Compare o CTR por posicionamento: se caiu só no Feed e não nos Stories, pode ser saturação específica daquele formato.",
          "Cheque também se algum concorrente novo entrou no seu leilão nesse período, o que também pressiona o CTR.",
        ],
      },
      {
        id: "ctr-3",
        sender: "user",
        time: "11:24",
        text: "A frequência está em 4.1. Como estruturo um teste A/B pra recuperar isso?",
      },
      {
        id: "ctr-4",
        sender: "ai",
        time: "11:25",
        text: "Com frequência nesse nível, recomendo testar 2 a 3 variações novas de criativo mantendo a mesma copy e CTA, mudando só o gancho visual dos 3 primeiros segundos. Rode por pelo menos 3 dias com orçamento igual entre as variações antes de decidir o vencedor.",
      },
    ],
  },
];

function Assistant() {
  const [messages, setMessages] = useState([
    MENSAGEM_BOAS_VINDAS,
    {
      id: 2,
      sender: "user",
      time: "09:13",
      text: "Como posso melhorar o desempenho das minhas campanhas no TikTok?"
    },
    {
      id: 3,
      sender: "ai",
      time: "09:13",
      text: "Com certeza! Analisando os padrões de conversão do seu nicho, aqui estão três recomendações fundamentais:",
      bullets: [
        "Publique conteúdo nos horários de maior pico de retenção (18h-21h).",
        "Use hashtags de tendência (trending) diretamente associadas ao seu público-alvo.",
        "Mantenha os vídeos entre 15 e 30 segundos, concentrando a proposta de valor nos primeiros 3 segundos para reter o usuário."
      ]
    }
  ]);

  const [activeConversationId, setActiveConversationId] = useState("nova");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const horaAtual = () =>
    new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // Scroll automático para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Abre uma conversa antiga do histórico dentro do chat principal
  const abrirConversa = (conversa) => {
    setIsTyping(false);
    setMessages(conversa.mensagens);
    setActiveConversationId(conversa.id);
  };

  // Começa uma conversa nova, do zero
  const iniciarNovaConversa = () => {
    setIsTyping(false);
    setMessages([{ ...MENSAGEM_BOAS_VINDAS, time: horaAtual() }]);
    setActiveConversationId("nova");
    inputRef.current?.focus();
  };

  // Função para enviar mensagem
  const handleSend = (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      time: horaAtual(),
      text: text
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput(""); // Limpa o input apenas se foi enviado por ele
    setIsTyping(true);

    // Resposta simulada da IA
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        sender: "ai",
        time: horaAtual(),
        text: "Processando dados das suas fontes de tráfego...",
        bullets: [
          "Identificamos uma queda de 12% no CTR dos seus criativos atuais nas últimas 48 horas.",
          "Recomendo realizar um teste A/B trocando a Headline da sua Landing Page.",
          "Foque em otimizar o público de Lookalike para melhorar o seu ROAS atual."
        ]
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1200);
  };

  // Enviar com a tecla Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="ai-page">
      {/* camada decorativa de fundo, na mesma linguagem visual do resto do app */}
      <div className="ai-bg-mesh" aria-hidden="true" />

      {/* CHAT PRINCIPAL */}
      <div className="chat-container">
        {/* HEADER */}
        <div className="chat-header">
          <div className="assistant-info">
            <div className="assistant-icon-ring">
              <div className="assistant-icon">
                <Bot size={20} />
              </div>
            </div>
            <div>
              <h2>AI Insights Assistant</h2>
              <div className="status-container">
                <span className="status-badge"></span>
                <p>Online • Pronto para analisar suas métricas</p>
              </div>
            </div>
          </div>
          <div className="chat-header-actions">
            <button className="new-chat-btn" onClick={iniciarNovaConversa} type="button">
              <Plus size={14} /> Nova conversa
            </button>
            <span className="assistant-model-pill">
              <Sparkles size={12} /> Eyesight AI
            </span>
          </div>
        </div>

        {/* LISTA DE MENSAGENS */}
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
              {msg.sender === "ai" && (
                <div className="message-icon">
                  <Sparkles size={14} />
                </div>
              )}
              <div className="message-block">
                <div className="message-content">
                  <p>{msg.text}</p>
                  {msg.bullets && (
                    <ul className="message-bullets">
                      {msg.bullets.map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
                {msg.time && <span className="message-time">{msg.time}</span>}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message-wrapper ai">
              <div className="message-icon">
                <Sparkles size={14} />
              </div>
              <div className="message-block">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* SUGESTÕES RÁPIDAS ACIMA DO INPUT */}
        <div className="chat-suggestions-row">
          {SUGESTOES_RAPIDAS.map((sugestao) => (
            <button
              key={sugestao}
              type="button"
              className="chat-suggestion-chip"
              onClick={() => handleSend(sugestao)}
              disabled={isTyping}
            >
              {sugestao}
            </button>
          ))}
        </div>

        {/* CAIXA DE INPUT */}
        <div className="chat-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            placeholder="Pergunte sobre ROAS, CAC, CTR ou peça sugestões de conteúdo..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
          />
          <button
            className="send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
          >
            <span>Enviar</span>
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* PAINEL DIREITO (AÇÕES RÁPIDAS) */}
      <div className="right-panel">
        <span className="panel-eyebrow">
          <Zap size={12} /> Central de Ações
        </span>
        <h2 className="panel-title">Ações Rápidas</h2>

        <div className="action-cards-grid">
          <div className="action-card" onClick={() => handleSend("Como posso otimizar minhas campanhas atuais para reduzir o CAC?")}>
            <div className="card-icon color-trend">
              <TrendingUp size={18} />
            </div>
            <div className="card-body">
              <h3>Otimizar Campanhas</h3>
              <p>Receba sugestões analíticas para reduzir custos de aquisição.</p>
            </div>
          </div>

          <div className="action-card" onClick={() => handleSend("Gere 5 ideias de criativos/conteúdo focados em conversão para redes sociais.")}>
            <div className="card-icon color-light">
              <Lightbulb size={18} />
            </div>
            <div className="card-body">
              <h3>Ideias de Conteúdo</h3>
              <p>Gere ganchos e ideias criativas baseadas nas tendências de marketing.</p>
            </div>
          </div>

          <div className="action-card" onClick={() => handleSend("Faça uma análise de performance geral com base nas métricas padrão.")}>
            <div className="card-icon color-message">
              <MessageSquare size={18} />
            </div>
            <div className="card-body">
              <h3>Análise de Performance</h3>
              <p>Entenda o comportamento das taxas de cliques e conversões das páginas.</p>
            </div>
          </div>

          <div className="action-card" onClick={() => handleSend("Quais automações de marketing inteligente posso configurar agora?")}>
            <div className="card-icon color-zap">
              <Zap size={18} />
            </div>
            <div className="card-body">
              <h3>Automação Inteligente</h3>
              <p>Configure regras automáticas de disparos e alertas de anomalias de dados.</p>
            </div>
          </div>
        </div>

        {/* HISTÓRICO RECENTE */}
        <div className="recent-conversations-section">
          <span className="panel-eyebrow">
            <Clock size={12} /> Histórico
          </span>
          <h2 className="panel-title">Conversas Recentes</h2>

          {HISTORICO_CONVERSAS.map((conversa) => (
            <div
              key={conversa.id}
              className={`conversation-card ${activeConversationId === conversa.id ? "active" : ""}`}
              onClick={() => abrirConversa(conversa)}
            >
              <div className="conv-header">
                <h4>{conversa.titulo}</h4>
                <div className="time-badge">
                  <Clock size={12} />
                  <span>{conversa.label}</span>
                </div>
              </div>
              <p>{conversa.resumo}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Assistant;