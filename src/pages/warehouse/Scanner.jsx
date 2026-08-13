import { useEffect, useRef, useState } from 'react'

import { supabase } from '../../lib/supabase'
import Shell from '../../components/Shell'

const MODES = [
  ['ENTRY', 'Entry'],
  ['BIN', 'Bin'],
  ['EXIT', 'Load'],
]

export default function Scanner() {
  const [mode, setMode] = useState('ENTRY')
  const [warehouses, setWarehouses] = useState([])
  const [bins, setBins] = useState([])
  const [warehouseId, setWarehouseId] = useState('')
  const [binCode, setBinCode] = useState('')
  const [manual, setManual] = useState('')
  const [result, setResult] = useState(null)
  const [cameraOn, setCameraOn] = useState(false)
  const scannerRef = useRef(null)
  const busyRef = useRef(false)

  useEffect(() => {
    supabase.from('warehouses').select('*').then(({ data }) => {
      setWarehouses(data ?? [])
      if (data?.length) setWarehouseId(data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!warehouseId) return
    supabase.from('bins').select('*').eq('warehouse_id', warehouseId).order('code')
      .then(({ data }) => setBins(data ?? []))
  }, [warehouseId])

  const submitScan = async (trackingId) => {
    if (busyRef.current) return
    busyRef.current = true
    setResult({ ok: null, text: `Processing ${trackingId}…` })
    const { data, error } = await supabase.rpc('record_scan', {
      p_tracking_id: trackingId,
      p_scan_type: mode,
      p_warehouse_id: warehouseId,
      p_bin_code: mode === 'BIN' ? binCode : null,
    })
    if (error) setResult({ ok: false, text: `✕ ${error.message}` })
    else setResult({ ok: true, text: `✓ ${data.tracking_id} → ${data.new_status.replaceAll('_', ' ')}` })
    setTimeout(() => { busyRef.current = false }, 1200)
  }

  const startCamera = async () => {
    const { Html5Qrcode } = await import('html5-qrcode') // lazy-load: keeps main bundle small
    setCameraOn(true)
    const scanner = new Html5Qrcode('qr-region')
    scannerRef.current = scanner
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 220, height: 220 } },
        (text) => submitScan(text.trim().toUpperCase()),
        () => {},
      )
    } catch (e) {
      setResult({ ok: false, text: `✕ Camera unavailable: ${e?.message ?? e}. Use manual entry below.` })
      setCameraOn(false)
    }
  }
  const stopCamera = async () => {
    try { await scannerRef.current?.stop(); await scannerRef.current?.clear() } catch {}
    setCameraOn(false)
  }
  useEffect(() => () => { scannerRef.current?.stop?.().catch(() => {}) }, [])

  const manualSubmit = (e) => {
    e.preventDefault()
    if (manual.trim()) { submitScan(manual.trim().toUpperCase()); setManual('') }
  }

  return (
    <Shell>
      <div className="page-head">
        <div><h1>Warehouse scanner</h1>
          <div className="sub">Entry receives cargo · Bin binds a shelf location · Load scans onto the assigned flight.</div></div>
      </div>

      <div className="card" style={{ maxWidth: 520 }}>
        <div className="scan-modes">
          {MODES.map(([m, label]) => (
            <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>{label}</button>
          ))}
        </div>

        <label className="field"><span className="lbl">Warehouse</span>
          <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </label>

        {mode === 'BIN' && (
          <label className="field"><span className="lbl">Bin location</span>
            <select value={binCode} onChange={(e) => setBinCode(e.target.value)}>
              <option value="">Select bin…</option>
              {bins.map((b) => <option key={b.id} value={b.code}>{b.code}</option>)}
            </select>
          </label>
        )}

        <div id="qr-region" style={{ display: cameraOn ? 'block' : 'none' }} />
        {!cameraOn
          ? <button className="btn" style={{ width: '100%' }} onClick={startCamera}>Start camera scan</button>
          : <button className="btn ghost" style={{ width: '100%', marginTop: 10 }} onClick={stopCamera}>Stop camera</button>}

        <form onSubmit={manualSubmit} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input className="mono" placeholder="Type tracking ID (SCL-…)" value={manual}
            onChange={(e) => setManual(e.target.value)} style={{ textTransform: 'uppercase' }} />
          <button className="btn dark">Scan</button>
        </form>

        {result && <div className={`scan-result ${result.ok === false ? 'err' : ''}`}>{result.text}</div>}
      </div>
    </Shell>
  )
}
