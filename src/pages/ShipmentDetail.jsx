import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Package, AlertTriangle, CheckCircle, Printer } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Shell from '../components/Shell'
import Stepper from '../components/Stepper'
import Timeline from '../components/Timeline'
import StatusChip from '../components/StatusChip'
import AnimatedRoute from '../components/animation/AnimatedRoute'
import { STATUS_LABELS, nextStatus, fmt } from '../lib/constants'

function getProgress(status) {
  const flow = ['BOOKED','RECEIVED_AT_WAREHOUSE','BINNED','MANIFESTED','ASSIGNED_TO_FLIGHT','LOADED','IN_FLIGHT','LANDED','CUSTOMS_CLEARANCE','CLEARED','OUT_FOR_DELIVERY','DELIVERED']
  const i = flow.indexOf(status)
  return i < 0 ? 0 : Math.round((i / (flow.length - 1)) * 100)
}

export default function ShipmentDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const isStaff = ['admin', 'ops'].includes(profile?.role)
  const [ship, setShip] = useState(null)
  const [events, setEvents] = useState([])
  const [pod, setPod] = useState(null)
  const [podUrl, setPodUrl] = useState(null)
  const [msg, setMsg] = useState(null)
  const [note, setNote] = useState('')

  const load = async () => {
    const { data: s } = await supabase.from('shipments').select('*').eq('id', id).single()
    setShip(s ?? null)
    const { data: ev } = await supabase.from('shipment_events').select('*').eq('shipment_id', id).order('created_at')
    setEvents(ev ?? [])
    const { data: p } = await supabase.from('proof_of_delivery').select('*').eq('shipment_id', id).maybeSingle()
    setPod(p ?? null)
    if (p?.signature_path) {
      const { data: signed } = await supabase.storage.from('pods').createSignedUrl(p.signature_path, 3600)
      setPodUrl(signed?.signedUrl ?? null)
    }
  }

  useEffect(() => {
    load()
    const ch = supabase.channel(`ship-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shipment_events', filter: `shipment_id=eq.${id}` }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [id])

  const advance = async (to) => {
    setMsg(null)
    const { error } = await supabase.rpc('advance_shipment', { p_shipment_id: id, p_new_status: to, p_note: note || null })
    if (error) setMsg({ t: 'err', m: error.message })
    else { setNote(''); setMsg({ t: 'ok', m: `Moved to ${STATUS_LABELS[to]}` }) }
  }

  const raiseException = async () => {
    if (!note.trim()) { setMsg({ t: 'err', m: 'Add a note describing the exception first.' }); return }
    advance('EXCEPTION')
  }

  if (!ship) return (
    <Shell>
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', margin: '0 auto' }} />
      </div>
    </Shell>
  )

  const nxt = nextStatus(ship.status)
  const progress = getProgress(ship.status)
  const showRoute = ['ASSIGNED_TO_FLIGHT','LOADED','IN_FLIGHT','LANDED','OUT_FOR_DELIVERY'].includes(ship.status)
  const isTruck = ship.status === 'OUT_FOR_DELIVERY'

  return (
    <Shell>
      <div className="page-head">
        <div>
          <h1 className="mono" style={{ color: 'var(--primary)' }}>{ship.tracking_id}</h1>
          <div className="sub">
            {ship.awb_number ? <span>AWB <span className="mono">{ship.awb_number}</span> · </span> : null}
            Booked {fmt(ship.created_at)} · {ship.pieces} pc · {ship.weight_kg ?? '—'} kg
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {ship.is_cold_chain && <span className="chip cold">❄ Cold chain</span>}
          <StatusChip status={ship.status} />
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="card glow" style={{ marginBottom: 14 }}>
          <Stepper status={ship.status} />
          {showRoute && (
            <AnimatedRoute
              origin={isTruck ? 'WH' : 'MAA'} destination={isTruck ? 'CUST' : 'DEL'}
              originName={isTruck ? 'Warehouse' : 'Chennai'} destName={isTruck ? 'Customer' : ship.destination_city || 'Delhi'}
              progress={progress} vehicle={isTruck ? 'truck' : 'plane'} status={ship.status}
            />
          )}
          {ship.status === 'DELIVERED' && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }}
              style={{ textAlign: 'center', padding: '16px 0' }}>
              <div className="success-circle">✅</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>Delivered successfully</div>
            </motion.div>
          )}
        </div>

        <div className="grid cols-2" style={{ alignItems: 'start' }}>
          <div>
            <div className="card">
              <h3 style={{ marginBottom: 10 }}>Consignment</h3>
              <table>
                <tbody>
                  <tr><td className="muted small">Receiver</td><td>{ship.receiver_name} · <span className="mono small">{ship.receiver_phone}</span></td></tr>
                  <tr><td className="muted small">Destination</td><td>{ship.destination_address}{ship.destination_city ? `, ${ship.destination_city}` : ''}</td></tr>
                  <tr><td className="muted small">Contents</td><td>{ship.description ?? '—'}</td></tr>
                  <tr><td className="muted small">Value</td><td>{ship.declared_value ? `₹${Number(ship.declared_value).toLocaleString('en-IN')}` : '—'}</td></tr>
                </tbody>
              </table>
            </div>

            {isStaff && (
              <div className="card">
                <h3 style={{ marginBottom: 10 }}>Operations</h3>
                {msg && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`alert ${msg.t}`}>{msg.m}</motion.div>}
                <label className="field">
                  <span className="lbl">Note (shown on customer timeline)</span>
                  <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Customs docs verified" />
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {nxt && nxt !== 'DELIVERED' && ship.status !== 'EXCEPTION' && (
                    <button className="btn" onClick={() => advance(nxt)}>Advance to {STATUS_LABELS[nxt]}</button>
                  )}
                  {nxt === 'DELIVERED' && profile?.role !== 'admin' && (
                    <span className="small muted">Delivery is completed by the driver with a signed PoD.</span>
                  )}
                  {nxt === 'DELIVERED' && profile?.role === 'admin' && (
                    <button className="btn" onClick={() => advance('DELIVERED')}>Force delivered (admin)</button>
                  )}
                  {ship.status === 'EXCEPTION' && (
                    <span className="small muted">Resolve from the Exceptions page.</span>
                  )}
                  {ship.status !== 'EXCEPTION' && ship.status !== 'DELIVERED' && (
                    <button className="btn warn" onClick={raiseException}><AlertTriangle size={14} />Raise exception</button>
                  )}
                </div>
              </div>
            )}

            {pod && (
              <div className="card">
                <h3 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} style={{ color: 'var(--success)' }} />Proof of delivery
                </h3>
                <p className="small">Signed by <strong>{pod.signed_by}</strong> · {fmt(pod.delivered_at)}</p>
                {podUrl && (
                  <img src={podUrl} alt="Signature" style={{ maxWidth: 260, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginTop: 10, background: '#fff', padding: 8 }} />
                )}
              </div>
            )}

            <div className="card print-area">
              <h3 style={{ marginBottom: 10 }}>Shipping label</h3>
              <div className="label-card">
                <div className="lc-head"><span>SPEEDCOOL</span><span>{ship.is_cold_chain ? '❄ COLD' : 'AIR'}</span></div>
                <div className="lc-tid">{ship.tracking_id}</div>
                <QRCodeSVG value={`${window.location.origin}/track/${ship.tracking_id}`} size={132} bgColor="transparent" fgColor="#38bdf8" />
                <div className="lc-row"><strong>To:</strong> {ship.receiver_name}</div>
                <div className="lc-row">{ship.destination_address}{ship.destination_city ? `, ${ship.destination_city}` : ''}</div>
                <div className="lc-row mono small">{ship.awb_number ?? 'AWB pending'} · {ship.pieces} pc · {ship.weight_kg ?? '—'} kg</div>
              </div>
              <button className="btn ghost small" style={{ marginTop: 12 }} onClick={() => window.print()}>
                <Printer size={13} />Print label
              </button>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 10 }}>Live timeline</h3>
            <Timeline events={events} />
          </div>
        </div>
      </motion.div>
    </Shell>
  )
}
