import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Package, Plane, Truck, AlertTriangle, CheckCircle, X } from 'lucide-react'

const ToastCtx = createContext({ show: () => {} })

const icons = {
  shipment: Package,
  flight: Plane,
  delivery: Truck,
  exception: AlertTriangle,
  success: CheckCircle,
}

const colors = {
  shipment: 'var(--primary)',
  flight: 'var(--secondary)',
  delivery: 'var(--success)',
  exception: 'var(--warning)',
  success: 'var(--success)',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((title, body, type = 'shipment') => {
    const id = Date.now()
    setToasts(p => [...p, { id, title, body, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000)
  }, [])

  const remove = (id) => setToasts(p => p.filter(t => t.id !== id))

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = icons[t.type] ?? Package
            const color = colors[t.type] ?? 'var(--primary)'
            return (
              <motion.div
                key={t.id}
                className="toast"
                initial={{ opacity: 0, x: 80, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <Icon size={20} style={{ color, flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <div className="toast-title">{t.title}</div>
                  {t.body && <div className="toast-body">{t.body}</div>}
                  <div className="toast-time">Just now</div>
                </div>
                <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, flexShrink: 0 }}>
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
