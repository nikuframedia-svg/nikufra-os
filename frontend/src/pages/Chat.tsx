import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import api from '../utils/api'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatResponse {
  answer: string
  model: string
  used_context: string
  mode: string
}

const quickPrompts = [
  { label: 'Explicar KPIs', mode: 'resumo' as const },
  { label: 'Resumo de produção', mode: 'resumo' as const },
  { label: 'Situação dos stocks', mode: 'inventario' as const },
  { label: 'Onde estão os gargalos?', mode: 'gargalos' as const },
]

const typingDelay = 12 // ms per character

const AnimatedMarkdown = ({ content }: { content: string }) => {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    setDisplayed('')
    let index = 0
    const interval = window.setInterval(() => {
      index += 1
      setDisplayed(content.slice(0, index))
      if (index >= content.length) {
        window.clearInterval(interval)
      }
    }, typingDelay)
    return () => window.clearInterval(interval)
  }, [content])

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-invert prose-sm max-w-none [&>p]:mb-2 [&>p]:leading-relaxed [&>ul>li]:mb-1"
    >
      {displayed || '🧠 ...'}
    </ReactMarkdown>
  )
}

export const Chat = () => {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [mode, setMode] = useState<'planeamento' | 'gargalos' | 'inventario' | 'resumo'>('resumo')
  const containerRef = useRef<HTMLDivElement>(null)

  const autoScroll = useCallback(() => {
    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
      }
    })
  }, [])

  const chatMutation = useMutation<ChatResponse, Error, { conversation: ChatMessage[]; mode: typeof mode }>({
    mutationFn: async ({ conversation, mode }) => {
      const response = await api.post('/chat', { messages: conversation, mode })
      const data = response.data
      if (data?.detail) {
        throw new Error(data.detail)
      }
      return data
    },
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }])
      autoScroll()
    },
    onError: () => {
      autoScroll()
    },
  })

  const emptyState = useMemo(() => messages.length === 0 && !chatMutation.isLoading, [messages, chatMutation.isLoading])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!input.trim() || chatMutation.isLoading) return

    const userMessage: ChatMessage = { role: 'user', content: input.trim() }
    const conversation = [...messages, userMessage]
    setMessages(conversation)
    setInput('')
    chatMutation.mutate({ conversation, mode })
    autoScroll()
  }

  const handleQuickPrompt = (prompt: { label: string; mode: typeof mode }) => {
    setInput(prompt.label)
    setMode(prompt.mode)
  }

  const handleExplainMore = () => {
    if (chatMutation.isLoading) return
    const lastAssistantIndex = [...messages].reverse().findIndex((msg) => msg.role === 'assistant')
    if (lastAssistantIndex === -1) return
    const explainMessage: ChatMessage = {
      role: 'user',
      content: 'Explica de forma mais detalhada, com foco técnico.',
    }
    const conversation = [...messages, explainMessage]
    setMessages(conversation)
    chatMutation.mutate({ conversation, mode })
    autoScroll()
  }

  useEffect(() => {
    autoScroll()
  }, [messages, autoScroll])

  const LoadingBubble = () => (
    <div className="flex max-w-[85%] items-center gap-3 rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-text-muted shadow-glow">
      <span className="text-lg">🧠</span>
      <span className="animate-pulse">Analisando dados…</span>
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Centro de insights</p>
          <h2 className="text-2xl font-semibold text-text-primary">Chat Inteligente</h2>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Conversa com o assistente industrial da Nikufra OPS. Ele lê planeamento, inventário e gargalos em tempo real e
            responde com recomendações acionáveis.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
            className="h-9 rounded-xl border border-border bg-surface px-3 text-xs text-text-primary outline-none transition hover:border-nikufra"
          >
            <option value="resumo">Resumo</option>
            <option value="planeamento">Planeamento</option>
            <option value="gargalos">Gargalos</option>
            <option value="inventario">Inventário</option>
          </select>
          {quickPrompts.map((prompt) => (
            <button
              key={prompt.label}
              onClick={() => handleQuickPrompt(prompt)}
              className="rounded-2xl border border-border bg-surface/70 px-3 py-1 text-xs text-text-muted transition hover:border-nikufra hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nikufra"
            >
              {prompt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="flex h-[600px] flex-col rounded-2xl border border-border bg-gradient-to-br from-[#0c1110] via-[#10181a] to-[#0c1413] shadow-glow">
          <div ref={containerRef} className="flex-1 space-y-4 overflow-y-auto p-6 pr-4">
            {emptyState && (
              <div className="flex h-full flex-col items-center justify-center text-center text-text-muted">
                <span className="mb-4 text-5xl">🤖</span>
                <p className="max-w-lg text-sm">
                  Carrega os ficheiros Excel para ativar o copiloto da fábrica. Pergunta, por exemplo, “Qual é a operação com
                  maior fila?” ou “Que SKU está prestes a romper stock?”.
                </p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={`${message.role}-${index}-${message.content}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={
                    message.role === 'user'
                      ? 'ml-auto max-w-[80%] rounded-2xl border border-nikufra/30 bg-nikufra/10 px-5 py-4 text-sm text-text-primary shadow-[0_0_25px_rgba(69,255,193,0.12)]'
                      : 'max-w-[85%] rounded-2xl border border-border/60 bg-black/40 px-5 py-4 text-sm text-text-body shadow-glow'
                  }
                >
                  {message.role === 'assistant' ? (
                    <AnimatedMarkdown content={message.content} />
                  ) : (
                    <p className="leading-relaxed">{message.content}</p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {chatMutation.isLoading && <LoadingBubble />}

            {chatMutation.isError && !chatMutation.isLoading && (
              <div className="max-w-[85%] rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
                {chatMutation.error.message}
              </div>
            )}
          </div>

          <div className="border-t border-border bg-black/40 p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-text-muted">
              <span>Modelo: {chatMutation.data?.model ?? 'llama3:8b • temperatura 0.3'}</span>
              <button
                type="button"
                onClick={handleExplainMore}
                disabled={chatMutation.isLoading || messages.length === 0}
                className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-text-muted transition hover:border-nikufra hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                🔍 Explicar mais
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Pergunta onde estão os gargalos, qual SKU está em risco ou como melhorar o OTD..."
                className="h-28 flex-1 resize-none rounded-2xl border border-border bg-black/40 px-4 py-3 text-sm text-text-primary outline-none transition focus:border-nikufra"
              />
              <button
                type="submit"
                disabled={!input.trim() || chatMutation.isLoading}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-nikufra text-background shadow-[0_0_30px_rgba(69,255,193,0.25)] transition hover:bg-nikufra-hover hover:shadow-[0_0_35px_rgba(69,255,193,0.4)] disabled:cursor-not-allowed disabled:bg-border"
              >
                ➤
              </button>
            </form>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-surface/60 p-5 shadow-glow">
            <h3 className="text-sm font-semibold text-text-primary">Contexto dos dados</h3>
            <p className="mt-2 text-sm text-text-muted">
              O copiloto lê KPIs de planeamento, riscos de inventário e estado do ETL. Se o LLM ficar offline, reinicia o
              Ollama (`ollama run llama3:8b`).
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.35em] text-text-muted">Sugestões</p>
            <ul className="mt-2 space-y-2 text-sm text-text-muted">
              <li>• Experimenta pedir “Comparar plano Antes vs Depois”.</li>
              <li>• Pergunta “Porque é que M-16 é gargalo?” para ler a análise técnica.</li>
              <li>• Usa “Qual o risco de rutura na classe A?” para receber ações concretas.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-surface/60 p-5 shadow-glow">
            <h3 className="text-sm font-semibold text-text-primary">Modo dopaminérgico</h3>
            <ul className="mt-2 space-y-2 text-sm text-text-muted">
              <li>• Cada resposta vem estruturada com ícones e secções explicativas.</li>
              <li>• Clica em “Explicar mais” para drill-down técnico instantâneo.</li>
              <li>• Observa as micro animações de cada mensagem e o brilho Nikufra.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
