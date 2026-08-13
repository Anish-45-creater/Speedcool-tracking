import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Package, Plane, Truck, AlertTriangle, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Shell from '../../components/Shell'
import StatusChip from '../../components/StatusChip'
import AnimatedCounter from '../../components/animation/AnimatedCounter'
import { STAGES, fmt } from '../../lib/constants'

const KPIs = [
  { label: 'Active shipments', key: 'total', icon: Package, gradient: 'linear-gradient(135deg,#38bdf8,#818cf8)', kpiColor: 'rgba(56,189,248,0.08)' },
  { label: 'In air transit', key: 'transit', icon: Plane, gradient: 'linear-gradient(135deg,#818cf8,#a855f7)', kpiColor: 'rgba(129,140,248,0.08)' },
  { label: 'Out for delivery', key: 'delivery', icon: Truck, gradient: 'linear-gradient(135deg,#22c55e,#16a34a)', kpiColor: 'rgba(34,197,94,0.08)' },
  { label: 'Open exceptions', key: 'exceptions', icon: AlertTriangle, gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', kpiColor: 'rgba(245,158,11,0.08)' },
]

export default function Board() {
  const [ships, setShips] = useState([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setBusy(true)
    const { data } = await supabase.from('shipments').select('*').neq('status', 'DELIVERED').order('updated_at', { ascending: false })
    setShips(data ?? [])
    setBusy(false)
  }, [])

  useEffect(() => {
    load()
    const ch = supabase.channel('board-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const exceptions = ships.filter((s) => s.status === 'EXCEPTION')
  const transit = ships.filter((s) => ['ASSIGNED_TO_FLIGHT','LOADED','IN_FLIGHT','LANDED'].includes(s.status))
  const delivery = ships.filter((s) => s.status === 'OUT_FOR_DELIVERY')
  const cols = STAGES.map((st) => ({ name: st.name, items: ships.filter((s) => st.statuses.includes(s.status)) }))

  const kpiValues = { total: ships.length, transit: transit.length, delivery: delivery.length, exceptions: exceptions.length }

  return (
    <Shell>
      <div className="page-head">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LayoutDashboard size={24} style={{ color: 'var(--primary)' }} />
            Live board
          </h1>
          <div className="sub">Every active consignment, updated in real time over WebSockets.</div>
        </div>
        <Link to="/ops/new" className="btn"><Plus size={15} />New shipment</Link>
      </div>

      {/* KPI cards */}
      <div className="grid cols-4" style={{ marginBottom: 20 }}>
        {KPIs.map(({ label, key, icon: Icon, gradient, kpiColor }, i) => (
          <motion.div key={key} className="kpi-card"
            style={{ '--kpi-gradient': gradient, '--kpi-color': kpiColor }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Icon size={28} className="kpi-icon" style={{ position: 'absolute', top: 16, right: 16, opacity: 0.15, color: 'var(--primary)' }} />
            <div className="kpi-label">{label}</div>
            <div className="kpi-number"><AnimatedCounter value={kpiValues[key]} /></div>
            {key === 'exceptions' && kpiValues.exceptions > 0 && (
              <div className="kpi-trend" style={{ color: 'var(--warning)' }}>
                ⚠ <Link to="/ops/exceptions" style={{ color: 'var(--warning)', fontSize: 12 }}>View exceptions</Link>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {exceptions.length > 0 && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="alert warn" style={{ marginBottom: 16 }}>
          <AlertTriangle size={16} />
          {exceptions.length} shipment(s) need attention —{' '}
          <Link to="/ops/exceptions" style={{ color: 'var(--warning)', fontWeight: 700 }}>open the exception queue</Link>
        </motion.div>
      )}

      {/* Kanban board */}
      <div className="board">
        {cols.map((col, ci) => (
          <motion.div key={col.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + ci * 0.06 }}>
            <div className="col-head"><span>{col.name}</span><span>{col.items.length}</span></div>
            <AnimatePresence>
              {col.items.map((s) => (
                <motion.div key={s.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                  <Link to={`/shipment/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className={`strip ${s.exception_open ? 'exception' : ''}`} style={{ cursor: 'pointer' }}>
                      <div className="grow">
                        <div className="tid" style={{ fontSize: 12 }}>{s.tracking_id}{s.is_cold_chain ? ' ❄' : ''}</div>
                        <div className="meta">{s.destination_city ?? '—'}</div>
                        <div className="meta" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmt(s.updated_at)}</div>
                      </div>
                      <StatusChip status={s.status} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
            {col.items.length === 0 && <p className="small muted" style={{ padding: '8px 4px' }}>Empty</p>}
          </motion.div>
        ))}
      </div>
    </Shell>
  )
}
