import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Plane, Truck, Package, CheckCircle, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fmt, STATUS_LABELS, STAGES, stageIndex } from '../lib/constants'
import AnimatedRoute from '../components/animation/AnimatedRoute'

function getProgress(status) {
  const flow = ['BOOKED','RECEIVED_AT_WAREHOUSE','BINNED','MANIFESTED','ASSIGNED_TO_FLIGHT','LOADED','IN_FLIGHT','LANDED','CUSTOMS_CLEARANCE','CLEARED','OUT_FOR_DELIVERY','DELIVERED']
  const i = flow.indexOf(status)
  if (i < 0) return 0
  return Math.round((i / (flow.length - 1)) * 100)
}

function getVehicle(status) {
  if (['IN_FLIGHT','LOADED','ASSIGNED_TO_FLIGHT'].includes(status)) return 'plane'
  if (['OUT_FOR_DELIVERY'].includes(status)) return 'truck'
  return 'plane'
}

export default function Track() {
  const { trackingId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(!!trackingId)
  const [input, setInput] = useState(trackingId ?? '')

  const load = async (id) => {
    const tid = (id ?? trackingId ?? '').trim().toUpperCase()
    if (!tid) return
    setLoading(true)
    const { data: res } = await supabase.rpc('public_track', { p_tracking_id: tid })
    if (!res) { setNotFound(true); setData(null) }
    else { setData(res); setNotFound(false) }
    setLoading(false)
  }

  useEffect(() => {
    if (trackingId) load(trackingId)
    else setLoading(false)
  }, [trackingId])

  useEffect(() => {
    if (!data) return
    const t = setInterval(() => load(data.tracking_id), 12000)
    return () => clearInterval(t)
  }, [data?.tracking_id])

  const progress = data ? getProgress(data.status) : 0
  const vehicle = data ? getVehicle(data.status) : 'plane'
  const isInFlight = data?.status === 'IN_FLIGHT'
  const isDelivering = data?.status === 'OUT_FOR_DELIVERY'
  const isDelivered = data?.status === 'DELIVERED'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '20px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: 20 }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <Link to="/" style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--text-primary)', textDecoration: 'none' }}>
            SPEED<span style={{ color: 'var(--primary)' }}>COOL</span>
          </Link>
          <Link to="/login" className="btn small ghost">Sign in</Link>
        </motion.div>

        {/* Search */}
        <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onSubmit={(e) => { e.preventDefault(); if (input.trim()) navigate(`/track/${input.trim().toUpperCase()}`) }}
          style={{ display: 'flex', gap: 10, marginBottom: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '6px 6px 6px 16px', alignItems: 'center' }}>
          <input style={{ background: 'transparent', border: 'none', flex: 1, fontFamily: 'var(--mono)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '8px 0', fontSize: 14 }}
            value={input} onChange={(e) => setInput(e.target.value.toUpperCase())} placeholder="SCL-XXXXXXXXXX" />
          <button className="btn small" type="submit">Track <ArrowRight size={13} /></button>
        </motion.form>

        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="card">
                <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 60, marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 120 }} />
              </div>
            </motion.div>
          )}

          {!loading && notFound && (
            <motion.div key="notfound" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <Package size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
                <h3 style={{ marginBottom: 8 }}>Shipment not found</h3>
                <p className="muted small">No shipment found for <span className="mono">{trackingId}</span>. Check the ID and try again.</p>
              </div>
            </motion.div>
          )}

          {!loading && data && (
            <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              {/* Hero status card */}
              <div className="card glow" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <div>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>{data.tracking_id}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      Booked {fmt(data.created_at)}{data.destination_city ? ` · to ${data.destination_city}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {data.is_cold_chain && <span className="chip cold">❄ Cold chain</span>}
                    <span className={`chip ${isDelivered ? 'delivered' : data.exception_open ? 'exception' : ''}`}>
                      {STATUS_LABELS[data.status] ?? data.status}
                    </span>
                  </div>
                </div>

                {data.exception_open && (
                  <motion.div className="alert warn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} />
                    Active exception — our team is on it. See the timeline below.
                  </motion.div>
                )}

                {/* Stepper */}
                <div className="stepper">
                  {STAGES.map((stage, i) => {
                    const idx = stageIndex(data.status)
                    const done = data.status === 'DELIVERED' || i < idx
                    const now = data.status !== 'DELIVERED' && i === idx
                    return (
                      <motion.div key={stage.name} className={`step ${done ? 'done' : ''} ${now ? 'now' : ''}`}
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
                        <div className="dot">{done ? '✓' : i + 1}</div>
                        <div className="nm">{stage.name}</div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Delivered success */}
                {isDelivered && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                    style={{ textAlign: 'center', marginTop: 16, padding: '16px 0' }}>
                    <div className="success-circle">✅</div>
                    <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, color: 'var(--success)', marginBottom: 4 }}>Delivered!</div>
                    <div className="muted small">Shipment successfully delivered</div>
                  </motion.div>
                )}

                {/* Flight animation */}
                {(isInFlight || isDelivering || progress > 0) && !isDelivered && (
                  <AnimatedRoute
                    origin={isDelivering ? 'WH' : 'MAA'}
                    destination={isDelivering ? 'DEST' : 'DEL'}
                    originName={isDelivering ? 'Warehouse' : 'Chennai'}
                    destName={isDelivering ? 'Customer' : data.destination_city || 'Destination'}
                    progress={progress}
                    vehicle={vehicle}
                    status={data.status}
                  />
                )}

                {isInFlight && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 10 }}>
                    {[['Altitude', '35,000 ft'], ['Speed', '840 km/h'], ['Progress', `${progress}%`]].map(([k, v]) => (
                      <div key={k} style={{ textAlign: 'center', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', padding: '10px 8px', border: '1px solid var(--border)' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 4 }}>{k}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}

                <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12, fontFamily: 'var(--mono)' }}>
                  Auto-refreshes every 12 seconds · No login needed
                </p>
              </div>

              {/* Timeline */}
              <div className="card">
                <h3 style={{ marginBottom: 12 }}>Journey timeline</h3>
                <ul className="timeline">
                  {[...(data.events || [])].reverse().map((e, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className={e.status === 'EXCEPTION' ? 'exception' : ''}>
                      <div className="t-status">{STATUS_LABELS[e.status] ?? e.status}</div>
                      <div className="t-meta">{fmt(e.at ?? e.created_at)}{(e.location ?? e.location_label) ? ` · ${e.location ?? e.location_label}` : ''}</div>
                      {e.note && <div className="t-note">{e.note}</div>}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
