import React, { useState, useEffect, useRef } from "react";
import "../styles/Assistant.css";
import { Sparkles, Send, TrendingUp, Lightbulb, MessageSquare, Zap, Clock } from "lucide-react";

function Assistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "Olá! Sou seu assistente de IA focado em métricas de marketing. Como posso ajudar você hoje? Posso analisar suas campanhas, sugerir otimizações de ROAS ou gerar insights de conteúdo."
    },
    {
      id: 2,
      sender: "user",
      text: "Como posso melhorar o desempenho das minhas campanhas no TikTok?"
    },
    {
      id: 3,
      sender: "ai",
      text: "Com certeza! Analisando os padrões de conversão do seu nicho, aqui estão três recomendações fundamentais:",
      bullets: [
        "Publique conteúdo nos horários de maior pico de retenção (18h-21h).",
        "Use hashtags de tendência (trending) diretamente associadas ao seu público-alvo.",
        "Mantenha os vídeos entre 15 e 30 segundos, concentrando a proposta de valor nos primeiros 3 segundos para reter o usuário."
      ]
    }
  ]);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Scroll automático para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Função para enviar mensagem
  const handleSend = (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: text
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput(""); // Limpa o input apenas se foi enviado por ele

    // Resposta simulada da IA
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        sender: "ai",
        text: "Processando dados das suas fontes de tráfego... 📊",
        bullets: [
          "Identificamos uma queda de 12% no CTR dos seus criativos atuais nas últimas 48 horas.",
          "Recomendo realizar um teste A/B trocando a Headline da sua Landing Page.",
          "Foque em otimizar o público de Lookalike para melhorar o seu ROAS atual."
        ]
      };
      setMessages((prev) => [...prev, aiMessage]);
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
      {/* CHAT PRINCIPAL */}
      <div className="chat-container">
        {/* HEADER */}
        <div className="chat-header">
          <div className="assistant-info">
            <div className="assistant-icon animate-pulse-subtle">
              <Sparkles size={22} />
            </div>
            <div>
              <h2>AI Insights Assistant</h2>
              <div className="status-container">
                <span className="status-badge"></span>
                <p>Online • Pronto para analisar suas métricas</p>
              </div>
            </div>
          </div>
        </div>

        {/* LISTA DE MENSAGENS */}
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
              {msg.sender === "ai" && (
                <div className="message-icon">
                  <Sparkles size={16} />
                </div>
              )}
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
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* CAIXA DE INPUT */}
        <div className="chat-input-wrapper">
          <input
            type="text"
            placeholder="Pergunte sobre ROAS, CAC, CTR ou peça sugestões de conteúdo..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="send-btn" onClick={() => handleSend()}>
            <span>Enviar</span>
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* PAINEL DIREITO (AÇÕES RÁPIDAS) */}
      <div className="right-panel">
        <h2 className="panel-title">Ações Rápidas</h2>

        <div className="action-cards-grid">
          <div className="action-card" onClick={() => handleSend("Como posso otimizar minhas campanhas atuais para reduzir o CAC?")}>
            <div className="card-icon color-trend">
              <TrendingUp size={20} />
            </div>
            <div className="card-body">
              <h3>Otimizar Campanhas</h3>
              <p>Receba sugestões analíticas para reduzir custos de aquisição.</p>
            </div>
          </div>

          <div className="action-card" onClick={() => handleSend("Gere 5 ideias de criativos/conteúdo focados em conversão para redes sociais.")}>
            <div className="card-icon color-light">
              <Lightbulb size={20} />
            </div>
            <div className="card-body">
              <h3>Ideias de Conteúdo</h3>
              <p>Gere ganchos e ideias criativas baseadas nas tendências de marketing.</p>
            </div>
          </div>

          <div className="action-card" onClick={() => handleSend("Faça uma análise de performance geral com base nas métricas padrão.")}>
            <div className="card-icon color-message">
              <MessageSquare size={20} />
            </div>
            <div className="card-body">
              <h3>Análise de Performance</h3>
              <p>Entenda o comportamento das taxas de cliques e conversões das páginas.</p>
            </div>
          </div>

          <div className="action-card" onClick={() => handleSend("Quais automações de marketing inteligente posso configurar agora?")}>
            <div className="card-icon color-zap">
              <Zap size={20} />
            </div>
            <div className="card-body">
              <h3>Automação Inteligente</h3>
              <p>Configure regras automáticas de disparos e alertas de anomalias de dados.</p>
            </div>
          </div>
        </div>

        {/* HISTÓRICO RECENTE */}
        <div className="recent-conversations-section">
          <h2 className="panel-title">Histórico Recente</h2>
          <div className="conversation-card">
            <div className="conv-header">
              <h4>Como melhorar meu ROAS?</h4>
              <div className="time-badge">
                <Clock size={12} />
                <span>Hoje</span>
              </div>
            </div>
            <p>Análise focada em escala de orçamento no Facebook Ads...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Assistant;