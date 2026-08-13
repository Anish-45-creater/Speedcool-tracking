import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Search, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Shell from '../../components/Shell'
import StatusChip from '../../components/StatusChip'
import { fmt } from '../../lib/constants'

export default function MyShipments() {
  const [ships, setShips] = useState([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setBusy(true)
    const { data } = await supabase.from('shipments').select('*').order('created_at', { ascending: false })
    setShips(data ?? [])
    setBusy(false)
  }, [])

  useEffect(() => {
    load()
    const ch = supabase.channel('my-ships-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'shipments' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const filtered = ships.filter((s) =>
    !q || s.tracking_id.toLowerCase().includes(q.toLowerCase()) ||
    (s.receiver_name ?? '').toLowerCase().includes(q.toLowerCase()))

  return (
    <Shell>
      <div className="page-head">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package size={24} style={{ color: 'var(--primary)' }} />My shipments
          </h1>
          <div className="sub">Live status — updates the moment anything changes anywhere in the network.</div>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input style={{ paddingLeft: 32, width: 240 }} placeholder="Search tracking ID or receiver" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 && !busy && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ textAlign: 'center', padding: 50 }}>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: 52, marginBottom: 16 }}>📦</motion.div>
          <h3 style={{ marginBottom: 8 }}>No shipments yet</h3>
          <p className="muted small">Your logistics journey will appear here once a shipment is created for your account.</p>
        </motion.div>
      )}

      <AnimatePresence>
        {filtered.map((s, i) => (
          <motion.div key={s.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 }}>
            <Link to={`/shipment/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className={`strip ${s.status === 'DELIVERED' ? 'delivered' : s.exception_open ? 'exception' : ''}`}>
                <div className="grow">
                  <div className="tid">{s.tracking_id}{s.is_cold_chain ? ' ❄' : ''}</div>
                  <div className="meta">{s.receiver_name} · {s.destination_city ?? s.destination_address} · {fmt(s.created_at)}</div>
                </div>
                <StatusChip status={s.status} />
              </div>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
    </Shell>
  )
}
