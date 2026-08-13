import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Stepper from '../components/Stepper'
import Timeline from '../components/Timeline'
import StatusChip from '../components/StatusChip'
import { fmt } from '../lib/constants'

export default function Track() {
  const { trackingId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState(trackingId ?? '')

  const load = async (id) => {
    const tid = (id ?? trackingId ?? '').trim().toUpperCase()
    if (!tid) return
    setLoading(true)
    const { data: res, error } = await supabase.rpc('public_track', {
      p_tracking_id: tid,
    })
    if (error || !res) {
      setNotFound(true)
      setData(null)
    } else {
      setData(res)
      setNotFound(false)
    }
    setLoading(false)
  }

  // Load on mount if trackingId is in the URL (from QR scan)
  useEffect(() => {
    if (trackingId) load(trackingId)
    else setLoading(false)
  }, [trackingId])

  // Auto refresh every 12 seconds when tracking
  useEffect(() => {
    if (!data) return
    const t = setInterval(() => load(data.tracking_id), 12000)
    return () => clearInterval(t)
  }, [data?.tracking_id])

  const handleSearch = (e) => {
    e.preventDefault()
    if (input.trim()) {
      navigate(`/track/${input.trim().toUpperCase()}`)
    }
  }

  return (
    <div className="auth-wrap" style={{ alignItems: 'flex-start', paddingTop: 40, background: '#eef3f5', minHeight: '100vh' }}>
      <div style={{ width: 680, maxWidth: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Link to="/" style={{ fontFamily: 'Barlow Semi Condensed, sans-serif', fontWeight: 700, fontSize: 24, color: '#0e1f2b', textDecoration: 'none' }}>
            SPEED<span style={{ color: '#0e93b0' }}>COOL</span>
          </Link>
          <Link to="/login" className="btn ghost small">Sign in</Link>
        </div>

        {/* Search box — always visible */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 10 }}>Track your shipment</h3>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
            <input
              className="mono"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder="SCL-XXXXXXXXXX"
              style={{ flex: 1, textTransform: 'uppercase' }}
            />
            <button className="btn" type="submit">Track</button>
          </form>
        </div>

        {/* Loading */}
        {loading && (
          <div className="card">
            <p className="muted">Loading shipment…</p>
          </div>
        )}

        {/* Not found */}
        {!loading && notFound && (
          <div className="card">
            <div className="alert err">
              No shipment found for <span className="mono">{trackingId}</span>.
              Please check the tracking ID and try again.
            </div>
            <p className="small muted" style={{ marginTop: 8 }}>
              The tracking ID is printed on your shipment label and looks like <span className="mono">SCL-A1B2C3D4E5</span>.
            </p>
          </div>
        )}

        {/* Shipment found */}
        {!loading && data && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{data.tracking_id}</div>
                <div className="muted small">
                  Booked {fmt(data.created_at)}
                  {data.destination_city ? ` · to ${data.destination_city}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {data.is_cold_chain && <span className="chip cold">❄ Cold chain</span>}
                <StatusChip status={data.status} />
              </div>
            </div>

            {data.exception_open && (
              <div className="alert warn">
                This shipment has an active exception. Our team is working on it — see the latest note below.
              </div>
            )}

            <Stepper status={data.status} />

            {data.status === 'DELIVERED' && (
              <div className="alert ok" style={{ marginTop: 10, textAlign: 'center' }}>
                ✓ Delivered successfully
              </div>
            )}

            {data.eta && (
              <p className="small muted" style={{ textAlign: 'center', marginTop: 6 }}>
                Estimated arrival: {fmt(data.eta)}
              </p>
            )}

            <h3 style={{ marginTop: 20, marginBottom: 8 }}>Journey timeline</h3>
            <Timeline events={data.events} />

            <p className="small muted" style={{ marginTop: 14, textAlign: 'center' }}>
              This page auto-refreshes every 12 seconds · No login needed
            </p>
          </div>
        )}

        {/* No tracking ID yet */}
        {!loading && !data && !notFound && !trackingId && (
          <div className="card">
            <p className="muted" style={{ textAlign: 'center' }}>
              Enter your tracking ID above to see live shipment status.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
