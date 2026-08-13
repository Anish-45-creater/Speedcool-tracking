import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plane, Package, Truck, CheckCircle, ArrowRight } from 'lucide-react'

const stages = [
  { icon: '📦', label: 'Booked', color: 'var(--primary)' },
  { icon: '🏭', label: 'Warehouse', color: 'var(--secondary)' },
  { icon: '✈️', label: 'In flight', color: '#7dd3fc' },
  { icon: '🛃', label: 'Customs', color: 'var(--warning)' },
  { icon: '🚚', label: 'Delivery', color: '#34d399' },
  { icon: '✅', label: 'Delivered', color: 'var(--success)' },
]

export default function Landing() {
  const [tid, setTid] = useState('')
  const navigate = useNavigate()

  const go = (e) => {
    e.preventDefault()
    if (tid.trim()) navigate(`/track/${tid.trim().toUpperCase()}`)
  }

  return (
    <div className="landing">
      {/* Animated glow orbs */}
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        style={{ position: 'absolute', top: '20%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <header>
        <div className="brand">SPEED<span>COOL</span></div>
        <Link to="/login" className="btn ghost" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Sign in</Link>
      </header>

      <div className="hero">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="eyebrow">
            <span className="live-dot" />
            Real-time air cargo · cold chain · door to door
          </div>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
          Every shipment,<br />visible from booking<br />to signature.
        </motion.h1>

        <motion.p className="lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          Real-time tracking across warehouse, flight, customs and last-mile delivery — with proactive alerts the moment anything changes.
        </motion.p>

        <motion.form className="track-box" onSubmit={go} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
          <input value={tid} onChange={(e) => setTid(e.target.value)} placeholder="SCL-XXXXXXXXXX" aria-label="Tracking ID" />
          <button className="btn" type="submit">
            Track shipment <ArrowRight size={15} />
          </button>
        </motion.form>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
          <Link to="/login" className="btn ghost">Sign in to console</Link>
        </motion.div>

        {/* Animated journey stages */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
          style={{ display: 'flex', gap: 0, marginTop: 56, alignItems: 'center', flexWrap: 'wrap', maxWidth: 700 }}>
          {stages.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
              style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', padding: '0 6px' }}>
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
                  style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</motion.div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: s.color, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{s.label}</div>
              </div>
              {i < stages.length - 1 && (
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  style={{ width: 20, height: 1, background: `linear-gradient(90deg, var(--border), var(--border-bright))`, margin: '0 2px', marginBottom: 14 }} />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
