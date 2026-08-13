import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Trash2, Send } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Shell from '../../components/Shell'
import { fmt } from '../../lib/constants'

function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['#38bdf8','#818cf8','#22c55e','#f59e0b','#a855f7'][Math.floor(Math.random() * 5)],
    size: 6 + Math.random() * 8,
  }))
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
      {pieces.map(p => (
        <motion.div key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: [1, 1, 0], rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }}
          transition={{ duration: 2 + Math.random(), delay: p.delay, ease: 'easeIn' }}
          style={{ position: 'fixed', top: 0, width: p.size, height: p.size, borderRadius: 2, background: p.color }} />
      ))}
    </div>
  )
}

export default function Deliver() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ship, setShip] = useState(null)
  const [signedBy, setSignedBy] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [delivered, setDelivered] = useState(false)
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const hasInk = useRef(false)

  useEffect(() => {
    supabase.from('shipments').select('*').eq('id', id).single()
      .then(({ data }) => { setShip(data); setSignedBy(data?.receiver_name ?? '') })
  }, [id])

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    c.width = c.offsetWidth * dpr
    c.height = 180 * dpr
    const ctx = c.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#38bdf8'

    const pos = (e) => {
      const r = c.getBoundingClientRect()
      const p = e.touches ? e.touches[0] : e
      return { x: p.clientX - r.left, y: p.clientY - r.top }
    }
    const down = (e) => { e.preventDefault(); drawing.current = true; const { x, y } = pos(e); ctx.beginPath(); ctx.moveTo(x, y) }
    const move = (e) => {
      if (!drawing.current) return
      e.preventDefault()
      const { x, y } = pos(e)
      ctx.lineTo(x, y); ctx.stroke(); hasInk.current = true
    }
    const up = () => { drawing.current = false }
    c.addEventListener('mousedown', down); c.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    c.addEventListener('touchstart', down, { passive: false })
    c.addEventListener('touchmove', move, { passive: false })
    c.addEventListener('touchend', up)
    return () => {
      c.removeEventListener('mousedown', down); c.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      c.removeEventListener('touchstart', down); c.removeEventListener('touchmove', move)
      c.removeEventListener('touchend', up)
    }
  }, [ship])

  const clearSig = () => {
    const c = canvasRef.current
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
    hasInk.current = false
  }

  const complete = async () => {
    setMsg(null)
    if (!signedBy.trim()) { setMsg({ t: 'err', m: 'Enter who signed for the delivery.' }); return }
    if (!hasInk.current) { setMsg({ t: 'err', m: 'Capture a signature first.' }); return }
    setBusy(true)
    try {
      const blob = await new Promise((res) => canvasRef.current.toBlob(res, 'image/png'))
      const path = `${ship.id}/signature-${Date.now()}.png`
      const { error: upErr } = await supabase.storage.from('pods').upload(path, blob, { contentType: 'image/png' })
      if (upErr) throw upErr
      let lat = null, lng = null
      try {
        const p = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 }))
        lat = p.coords.latitude; lng = p.coords.longitude
      } catch { }
      const { error } = await supabase.rpc('complete_delivery', {
        p_shipment_id: ship.id, p_signed_by: signedBy.trim(),
        p_signature_path: path, p_lat: lat, p_lng: lng,
      })
      if (error) throw error
      setDelivered(true)
      setTimeout(() => navigate('/driver'), 3500)
    } catch (e) {
      setMsg({ t: 'err', m: e.message ?? String(e) })
    }
    setBusy(false)
  }

  if (!ship) return (
    <Shell>
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', margin: '0 auto' }} />
      </div>
    </Shell>
  )

  if (delivered) return (
    <Shell>
      <Confetti />
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="success-circle" style={{ margin: '0 auto 20px' }}>✅</div>
        <h1 style={{ color: 'var(--success)', marginBottom: 8 }}>Delivery Complete!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>
          Signed by <strong style={{ color: 'var(--text-primary)' }}>{signedBy}</strong>
        </p>
        <p className="muted small">Proof of delivery saved · Customer notified · Returning to route…</p>
        <div style={{ marginTop: 24 }}>
          <span className="mono" style={{ color: 'var(--primary)', fontSize: 13 }}>{ship.tracking_id}</span>
        </div>
      </motion.div>
    </Shell>
  )

  return (
    <Shell>
      <div className="page-head">
        <div>
          <h1 className="mono">{ship.tracking_id}</h1>
          <div className="sub">{ship.receiver_name} · {ship.destination_address}</div>
        </div>
      </div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="card" style={{ maxWidth: 540 }}>
          {msg && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`alert ${msg.t}`}>
              {msg.m}
            </motion.div>
          )}

          <label className="field">
            <span className="lbl">Received & signed by</span>
            <input value={signedBy} onChange={(e) => setSignedBy(e.target.value)} />
          </label>

          <div style={{ marginBottom: 6 }}>
            <span className="lbl" style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
              Signature — draw with finger or mouse
            </span>
          </div>
          <div style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-bright)', background: 'rgba(56,189,248,0.02)', marginBottom: 12 }}>
            <canvas ref={canvasRef} className="sig-pad" style={{ height: 180, display: 'block' }} />
            <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(56,189,248,0.2)', letterSpacing: '0.2em' }}>SIGN HERE</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className="btn ghost small" onClick={clearSig} style={{ flex: 1 }}>
              <Trash2 size={13} />Clear
            </button>
            <button className="btn success" style={{ flex: 2 }} disabled={busy} onClick={complete}>
              {busy ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%' }} />
              ) : (
                <><Send size={14} />Complete delivery</>
              )}
            </button>
          </div>
          <p className="small muted" style={{ textAlign: 'center' }}>
            Saves the signed proof of delivery, records GPS location, and instantly notifies the customer.
          </p>
        </div>
      </motion.div>
    </Shell>
  )
}
