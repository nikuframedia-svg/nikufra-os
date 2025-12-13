import { NavLink, Route, Routes } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Planning } from './pages/Planning'
import { Bottlenecks } from './pages/Bottlenecks'
import { Inventory } from './pages/Inventory'
import { WhatIf } from './pages/WhatIf'
import { Chat } from './pages/Chat'
import { Suggestions } from './pages/Suggestions'
import { DataUploader } from './components/DataUploader'

const queryClient = new QueryClient()

const tabs = [
  { path: '/', label: 'Planeamento' },
  { path: '/bottlenecks', label: 'Gargalos' },
  { path: '/inventory', label: 'Inventário' },
  { path: '/suggestions', label: 'Sugestões' },
  { path: '/whatif', label: 'What-If' },
  { path: '/chat', label: 'Chat Inteligente' },
]

function Shell() {
  return (
    <div className="min-h-screen bg-background text-text-body">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-nikufra/10 text-xl text-nikufra">
              ⚙️
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Nikufra Ops</p>
              <h1 className="text-lg font-semibold text-text-primary">ProdPlan 4.0 + SmartInventory</h1>
            </div>
          </div>
          <div className="flex items-center">
            <DataUploader />
          </div>
        </div>
        <nav className="border-t border-border">
          <div className="container flex flex-wrap items-center gap-2 py-3">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.path === '/'}
                className={({ isActive }) =>
                  `relative rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'
                  }`
                }
              >
                {({ isActive }) => (
                  <span className="relative">
                    {tab.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute -bottom-2 left-0 right-0 h-0.5 rounded-full bg-nikufra"
                      />
                    )}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="container pb-16 pt-8">
        <Routes>
          <Route path="/" element={<Planning />} />
          <Route path="/bottlenecks" element={<Bottlenecks />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/whatif" element={<WhatIf />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/suggestions" element={<Suggestions />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Shell />
    </QueryClientProvider>
  )
}

export default App


