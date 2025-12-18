import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import axios from 'axios'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import clsx from 'clsx'
import api from '../utils/api'
import { batchStorage } from '../utils/batchStorage'

interface EtlStatus {
  last_run?: string
  files?: Array<{
    filename: string
    status: string
    summary?: Record<string, number>
    timestamp: string
  }>
  startup_summary?: Record<string, number>
  startup_error?: string
}

const invalidateKeys = [
  ['etl-status'],
  ['plan'],
  ['inventory'],
  ['bottlenecks'],
  ['suggestions'],
  ['resumo'],
  ['rop'],
  ['insight-summary'],
  ['insight', 'planeamento'],
  ['insight', 'gargalos'],
  ['insight', 'inventario'],
  ['insight', 'sugestoes'],
]

export const DataUploader = () => {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [progressMessage, setProgressMessage] = useState('')
  const queryClient = useQueryClient()

  const { data: status, refetch } = useQuery<EtlStatus>({
    queryKey: ['etl-status'],
    queryFn: async () => {
      const response = await axios.get('/api/etl/status')
      return response.data
    },
  })

  const lastUploadText = useMemo(() => {
    if (!status?.last_run) return 'Nenhum upload ainda'
    return `Último upload há ${formatDistanceToNow(new Date(status.last_run), { locale: pt })}`
  }, [status])

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted.length) return
      setSelectedFiles(accepted)
      setUploading(true)
      setProgressMessage('📈 Processando roteiros…')

      const abort = new AbortController()
      const timeout = setTimeout(() => abort.abort(), 30_000)

      const formData = new FormData()
      accepted.forEach((file) => formData.append('files', file))

      const toastId = toast.loading('A importar ficheiros...')
      let finalizedToast = false

      try {
        const response = await fetch('/api/etl/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'X-API-Key': (import.meta.env?.VITE_API_KEY as string) ?? '',
          },
          signal: abort.signal,
        })

        if (!response.ok) {
          const message = (await response.text()) || response.statusText
          toast.error(`Falha no import: ${message}`, { id: toastId })
          finalizedToast = true
          return
        }

        // Extrair batch_id da resposta
        const responseData = await response.json()
        const newBatchId = responseData?.batch_id || responseData?.status?.batch_id
        if (newBatchId) {
          batchStorage.set(newBatchId)
        }

        setProgressMessage('🧩 Normalizando stocks…')
        const invalidatePromises = invalidateKeys.map((key) =>
          key[0] === 'etl-status' ? refetch() : queryClient.invalidateQueries({ queryKey: key }),
        )
        const results = await Promise.allSettled(invalidatePromises)

        const failed = results
          .map((result, index) => (result.status === 'rejected' ? invalidateKeys[index].join(':') : null))
          .filter((value): value is string => Boolean(value))

        if (failed.length) {
          toast.error(`Import concluído mas falhou a atualização de: ${failed.join(', ')}`, { id: toastId })
        } else {
          toast.success('Dados importados com sucesso. A atualizar dashboards...', { id: toastId })
        }
        finalizedToast = true

        try {
          setProgressMessage('✅ Planeamento atualizado.')
          const summary = await api.get('/insight/summary')
          if (summary.data?.summary) {
            toast.success(summary.data.summary.split('\n')[0] ?? 'Resumo atualizado pelo LLM.')
          }
        } catch (insightError) {
          console.warn('Falha ao gerar resumo pós-upload', insightError)
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          toast.error('Tempo de espera excedido durante o upload.', { id: toastId })
        } else {
          const message = error instanceof Error ? error.message : 'Erro desconhecido'
          toast.error(`Falha no upload. ${message}`, { id: toastId })
          console.error('Upload error', error)
        }
        finalizedToast = true
      } finally {
        clearTimeout(timeout)
        setUploading(false)
        setOpen(false)
        setSelectedFiles([])
        setProgressMessage('')
        if (!finalizedToast) {
          toast.dismiss(toastId)
        }
      }
    },
    [queryClient, refetch],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    multiple: true,
  })

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-2xl bg-nikufra px-5 py-2 text-sm font-semibold text-background shadow-glow transition-transform duration-200 hover:scale-105 hover:bg-nikufra-hover"
      >
        <span role="img" aria-hidden>
          ⬆️
        </span>
        Carregar Dados
      </button>
      <span className="ml-3 text-xs text-text-muted">{lastUploadText}</span>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
            onClick={(e) => {
              if (!uploading && e.target === e.currentTarget) {
                setOpen(false)
                setSelectedFiles([])
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
              className="absolute left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface shadow-glow"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Importar ficheiros Excel</h2>
                  <p className="text-sm text-text-muted">
                    Arraste e largue os ficheiros de produção ou stocks (.xlsx) ou selecione manualmente.
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!uploading) {
                      setOpen(false)
                      setSelectedFiles([])
                    }
                  }}
                  className="rounded-full border border-border p-2 text-text-muted transition-colors hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploading}
                  type="button"
                >
                  ✕
                </button>
              </div>

              <div className="px-6 py-8">
                <div
                  {...getRootProps({
                    className: clsx(
                      'flex h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all',
                      isDragActive ? 'border-nikufra bg-nikufra/5' : 'border-border bg-surface',
                      uploading && 'animate-pulse border-nikufra',
                    ),
                    onKeyDown: (event) => {
                      if (event.key === 'Escape' && !uploading) setOpen(false)
                    },
                  })}
                  data-testid="dropzone"
                >
                  <input {...getInputProps()} />
                  <motion.div animate={{ scale: isDragActive ? 1.05 : 1 }} className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-nikufra/10 p-4 text-3xl">📁</div>
                    <div className="text-center">
                      <p className="text-base font-semibold text-text-primary">
                        {isDragActive ? 'Largar ficheiros aqui' : 'Arraste ficheiros .xlsx ou clique para selecionar'}
                      </p>
                      <p className="mt-1 text-sm text-text-muted">
                        Reconhecemos automaticamente roteiros, staffing, ordens, movimentos de stock e snapshots.
                      </p>
                    </div>
                    {uploading && (
                      <div className="mt-4 w-full space-y-2 text-left">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                          <div className="h-full animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-nikufra/0 via-nikufra to-nikufra/0" />
                        </div>
                        <p className="text-xs text-text-muted">{progressMessage || '🧠 Analisando...'}</p>
                      </div>
                    )}
                  </motion.div>
                </div>

                {selectedFiles.length > 0 && !uploading && (
                  <div className="mt-6 rounded-xl border border-border bg-surface/80 p-4 text-sm text-text-muted">
                    <p className="mb-2 font-medium text-text-primary">Pronto a importar:</p>
                    <ul className="space-y-1">
                      {selectedFiles.map((file) => (
                        <li key={file.name} className="flex items-center justify-between">
                          <span>{file.name}</span>
                          <span className="text-xs">{(file.size / 1024).toFixed(1)} KB</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {status?.files && status.files.length > 0 && (
                  <div className="mt-8">
                    <h3 className="mb-3 text-sm font-semibold text-text-primary">Histórico recente</h3>
                    <div className="max-h-40 space-y-2 overflow-y-auto pr-2 text-sm text-text-muted">
                      {status.files
                        .slice()
                        .reverse()
                        .slice(0, 6)
                        .map((file) => (
                          <div
                            key={`${file.filename}-${file.timestamp}`}
                            className="flex items-center justify-between rounded-xl border border-border bg-surface/80 px-3 py-2"
                          >
                            <div>
                              <p className="font-medium text-text-primary">{file.filename}</p>
                              <p className="text-xs text-text-muted">
                                {formatDistanceToNow(new Date(file.timestamp), { addSuffix: true, locale: pt })}
                              </p>
                            </div>
                            <span
                              className={clsx(
                                'rounded-full px-3 py-1 text-xs font-semibold uppercase',
                                file.status === 'processed' ? 'bg-nikufra/10 text-nikufra' : 'bg-danger/10 text-danger',
                              )}
                            >
                              {file.status}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
