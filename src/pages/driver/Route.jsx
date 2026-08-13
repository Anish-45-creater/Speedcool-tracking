import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation, Phone, MapPin, Truck, CheckCircle, Package } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Shell from '../../components/Shell'
import { fmt } from '../../lib/constants'

export default function DriverRoute() {
  const { session } = useAuth()
  const [stops, setStops] = useState([])
  const [done, setDone] = useState([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setBusy(true)
    const { data } = await supabase.from('delivery_assignments')
      .select('*, shipments(id,tracking_id,receiver_name,receiver_phone,destination_address,destination_city,is_cold_chain,status)')
      .order('sequence')
    const all = data ?? []
    setStops(all.filter((a) => !a.completed_at))
    setDone(all.filter((a) => a.completed_at))
    setBusy(false)
  }, [])

  useEffect(() => {
    load()
    const ch = supabase.channel('driver-route-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_assignments' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [session?.user?.id])

  const navigateTo = (a) => {
    const dest = encodeURIComponent(`${a.shipments?.destination_address ?? ''} ${a.shipments?.destination_city ?? ''}`)
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank')
  }

  return (
    <Shell>
      <div className="page-head">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Truck size={24} style={{ color: 'var(--success)' }} />
            My route
          </h1>
          <div className="sub">{stops.length} stop{stops.length !== 1 ? 's' : ''} remaining today · Pull to refresh</div>
        </div>
      </div>

      {/* Live truck animation when delivering */}
      {stops.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="card" style={{ marginBottom: 16, background: 'linear-gradient(135deg,rgba(34,197,94,0.08),rgba(56,189,248,0.05))', borderColor: 'rgba(34,197,94,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <motion.div animate={{ x: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 32 }}>🚚</motion.div>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>On duty · Delivering</div>
              <div className="muted small">{stops.length} stop{stops.length !== 1 ? 's' : ''} in your queue</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div className="live-badge"><span className="live-dot" />LIVE</div>
            </div>
          </div>
          {/* Mini route visualization */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, overflowX: 'auto', paddingBottom: 4 }}>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 16 }}>🏭</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>WH</div>
            </div>
            {stops.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <motion.div animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i*0.3 }}
                  style={{ width: 30, height: 1, background: `linear-gradient(90deg,var(--success),var(--primary))` }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14 }}>📍</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--primary)', marginTop: 2 }}>#{i+1}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {stops.map((a, i) => (
          <motion.div key={a.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 25 }}>
            <div className="card" style={{ marginBottom: 12, border: '1px solid rgba(56,189,248,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>
                    {a.shipments?.tracking_id}{a.shipments?.is_cold_chain ? ' ❄' : ''}
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{a.shipments?.receiver_name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={12} />{a.shipments?.destination_address}{a.shipments?.destination_city ? `, ${a.shipments.destination_city}` : ''}
                  </div>
                  <a href={`tel:${a.shipments?.receiver_phone}`} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--primary)', fontSize: 13, marginTop: 4, textDecoration: 'none' }}>
                    <Phone size={12} />{a.shipments?.receiver_phone}
                  </a>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn ghost small" style={{ flex: 1 }} onClick={() => navigateTo(a)}>
                  <Navigation size={13} />Navigate
                </button>
                <Link to={`/driver/deliver/${a.shipments?.id}`} className="btn small success" style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Package size={13} />Deliver
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {stops.length === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ textAlign: 'center', padding: 40 }}>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} style={{ fontSize: 48, marginBottom: 16 }}>🚚</motion.div>
          <h3 style={{ marginBottom: 8 }}>No pending stops</h3>
          <p className="muted small">Dispatched shipments appear here automatically — no refresh needed.</p>
        </motion.div>
      )}

      {done.length > 0 && (
        <>
          <h3 style={{ margin: '22px 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={18} style={{ color: 'var(--success)' }} />Completed today
          </h3>
          {done.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <div className={`strip delivered`}>
                <div className="grow">
                  <div className="tid">{a.shipments?.tracking_id}</div>
                  <div className="meta">Delivered {fmt(a.completed_at)}</div>
                </div>
                <span className="chip delivered">✓ Delivered</span>
              </div>
            </motion.div>
          ))}
        </>
      )}
    </Shell>
  )
}
