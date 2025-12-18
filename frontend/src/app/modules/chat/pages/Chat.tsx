/**
 * CHAT Module - Assistente integrado
 * Industrial: denso, estados completos, histórico
 */

import { useState, useRef, useEffect } from 'react';
import {
  Panel,
  SectionHeader,
  Button,
  Loading,
  Empty,
  NotSupportedState,
  PageCommandBox,
  QuickNote,
  tokens,
} from '../../../../ui-kit';
import { useBackendHealth } from '../../../../api/hooks/useBackendHealth';
import api from '../../../../services/api-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check backend health
  const { data: health } = useBackendHealth();
  const isBackendOffline = !health || health.status === 'unhealthy';
  
  // Chat é local-first por padrão
  // Só integra backend se VITE_CHAT_BACKEND_ENABLED=true e endpoint real confirmado
  const chatBackendEnabled = import.meta.env.VITE_CHAT_BACKEND_ENABLED === 'true';
  const isSupported = chatBackendEnabled && !isBackendOffline;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isSupported) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/chat/message', { message: input.trim() });
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message || response.data.answer || 'Resposta recebida',
        timestamp: new Date(),
        context: response.data.context,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.response?.data?.detail || error.message || 'Erro ao enviar mensagem',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: tokens.spacing.lg, 
      height: 'calc(100vh - 80px)', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      <PageCommandBox onSearch={() => {}} />
      <h1 style={{ 
        fontSize: tokens.typography.fontSize.title.lg, 
        fontWeight: tokens.typography.fontWeight.bold, 
        color: tokens.colors.text.title, 
        marginBottom: tokens.spacing.lg 
      }}>
        Chat Assistant
      </h1>

      {isBackendOffline ? (
        <NotSupportedState
          reason="Backend offline"
          suggestion="Verifique se o servidor está rodando e se PostgreSQL está conectado"
          feature="chat"
        />
      ) : !isSupported ? (
        <NotSupportedState
          reason="Chat API não configurada"
          suggestion="Configure LLM_API_KEY no backend para habilitar o chat assistant. Notas locais continuam disponíveis."
          feature="chat"
        />
      ) : (
        <>
          {/* Messages Area */}
          <Panel style={{ flex: 1, overflow: 'auto', marginBottom: tokens.spacing.md }}>
            <SectionHeader title="Conversa" />
            
            {messages.length === 0 ? (
              <Empty message="Sem mensagens. Comece uma conversa!" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      padding: tokens.spacing.md,
                      backgroundColor: msg.role === 'user' 
                        ? tokens.colors.primary.light 
                        : tokens.colors.card.elevated,
                      borderRadius: tokens.borderRadius.card,
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                    }}
                  >
                    <div style={{ 
                      fontSize: tokens.typography.fontSize.label, 
                      color: tokens.colors.text.muted,
                      marginBottom: tokens.spacing.xs,
                    }}>
                      {msg.role === 'user' ? 'Você' : 'Assistente'} • {msg.timestamp.toLocaleTimeString()}
                    </div>
                    <div style={{ 
                      fontSize: tokens.typography.fontSize.body.sm, 
                      color: tokens.colors.text.body 
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            {isLoading && (
              <div style={{ padding: tokens.spacing.md }}>
                <Loading />
              </div>
            )}
          </Panel>

          {/* Input Area */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: tokens.spacing.sm }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre ordens, fases, WIP, qualidade..."
              style={{
                flex: 1,
                padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                backgroundColor: tokens.colors.card.default,
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: tokens.borderRadius.input,
                color: tokens.colors.text.body,
                fontSize: tokens.typography.fontSize.body.sm,
                fontFamily: tokens.typography.fontFamily,
                outline: 'none',
              }}
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              Enviar
            </Button>
          </form>
        </>
      )}

      {/* Quick Note - sempre disponível */}
      <QuickNote routeKey="chat:notes" placeholder="Notas da conversa..." />
      
      {/* Comandos locais sempre disponíveis */}
      <div style={{ 
        marginTop: tokens.spacing.md, 
        padding: tokens.spacing.sm, 
        backgroundColor: tokens.colors.card.default,
        borderRadius: tokens.borderRadius.card,
        fontSize: tokens.typography.fontSize.body.xs,
        color: tokens.colors.text.muted,
      }}>
        <strong>Comandos locais (sempre disponíveis):</strong>
        <ul style={{ margin: 0, paddingLeft: tokens.spacing.lg, marginTop: tokens.spacing.xs }}>
          <li>"ordem X" ou "of X" → Abre ordem X</li>
          <li>"fase X" → Abre WIP Explorer com fase X</li>
          <li>"riscos overdue" → Abre Due Risk</li>
          <li>Use "/" em qualquer página para comandos rápidos</li>
        </ul>
      </div>
    </div>
  );
}

