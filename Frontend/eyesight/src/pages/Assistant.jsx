/* importando o css da tela */
import "../styles/Assistant.css";
import { Sparkles, Send, TrendingUp, Lightbulb, MessageSquare, Zap } from "lucide-react";
import { useState } from "react";

function Assistant() {

  /* mensagens iniciais */
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Olá! Sou seu assistente de IA. Como posso ajudar você hoje? Posso analisar suas métricas, sugerir otimizações ou gerar ideias de conteúdo."
    },

    {
      sender: "user",
      text: "Como posso melhorar o desempenho das minhas campanhas no TikTok?"
    },

    {
      sender: "ai",
      text: `• Publique conteúdo nos horários de pico (18h-21h)

• Use hashtags trending relacionadas ao seu nicho

• Teste vídeos de 15-30 segundos para melhor engajamento`
    }
  ]);

  /* estado do input */
  const [input, setInput] = useState("");

  /* função enviar mensagem */
  const sendMessage = () => {

    if (!input.trim()) return;

    /* mensagem do usuario */
    const userMessage = {
      sender: "user",
      text: input
    };

    /* adicionando mensagem */
    setMessages((prev) => [...prev, userMessage]);

    /* limpando input */
    setInput("");

    /* resposta fake da IA */
    setTimeout(() => {

      const aiMessage = {
        sender: "ai",
        text: "Analisando seus dados... Recomendo testar novos criativos, melhorar a segmentação do público e acompanhar métricas como CTR e ROAS."
      };

      setMessages((prev) => [...prev, aiMessage]);

    }, 1000);

  };

  return (

    <div className="ai-page">

      {/* CHAT PRINCIPAL */}
      <div className="chat-container">

        {/* HEADER */}
        <div className="chat-header">

          <div className="assistant-info">

            <div className="assistant-icon">
              <Sparkles size={22} />
            </div>

            <div>
              <h2>AI Assistant</h2>
              <p>Sempre disponível</p>
            </div>

          </div>

        </div>

        {/* MENSAGENS */}
        <div className="chat-messages">

          {messages.map((msg, index) => (

            <div
              key={index}
              className={`message ${msg.sender}`}
            >

              {msg.sender === "ai" && (
                <div className="message-icon">
                  <Sparkles size={18} />
                </div>
              )}

              <div className="message-content">
                <p>{msg.text}</p>
              </div>

            </div>

          ))}

        </div>

        {/* INPUT */}
        <div className="chat-input">

          <input
            type="text"
            placeholder="Digite sua pergunta..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <button onClick={sendMessage}>
            <Send size={18} />
            Enviar
          </button>

        </div>

      </div>

      {/* PAINEL DIREITO */}
      <div className="right-panel">

        <h2>Ações Rápidas</h2>

        <div className="action-card">

          <div className="card-icon">
            <TrendingUp size={20} />
          </div>

          <div>
            <h3>Otimizar Campanhas</h3>
            <p>
              Receba sugestões de otimização para suas campanhas
            </p>
          </div>

        </div>

        <div className="action-card">

          <div className="card-icon">
            <Lightbulb size={20} />
          </div>

          <div>
            <h3>Ideias de Conteúdo</h3>
            <p>
              Gere ideias criativas para suas redes sociais
            </p>
          </div>

        </div>

        <div className="action-card">

          <div className="card-icon">
            <MessageSquare size={20} />
          </div>

          <div>
            <h3>Análise de Performance</h3>
            <p>
              Obtenha insights sobre o desempenho das suas publicações
            </p>
          </div>

        </div>

        <div className="action-card">

          <div className="card-icon">
            <Zap size={20} />
          </div>

          <div>
            <h3>Automação Inteligente</h3>
            <p>
              Configure automações baseadas em IA
            </p>
          </div>

        </div>

        {/* CONVERSAS */}
        <div className="recent-conversations">

          <h2>Conversas Recentes</h2>

          <div className="conversation-card">

            <h4>Como melhorar meu ROAS?</h4>

            <p>
              Baseado nos dados, sugiro...
            </p>

            <span>Hoje</span>

          </div>

        </div>

      </div>

    </div>

  );

}
/* exportando o componente */
export default Assistant;