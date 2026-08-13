import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Shell from '../../components/Shell'
import { fmt } from '../../lib/constants'

export default function Flights() {
  const [flights, setFlights] = useState([])
  const [form, setForm] = useState({ flight_number: '', carrier: '', origin_iata: '', destination_iata: '', scheduled_departure: '', scheduled_arrival: '' })
  const [msg, setMsg] = useState(null)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const load = async () => {
    const { data } = await supabase.from('flights').select('*')
      .order('scheduled_departure', { ascending: false }).limit(30)
    setFlights(data ?? [])
  }
  useEffect(() => {
    load()
    const ch = supabase.channel('flights')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flights' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const create = async (e) => {
    e.preventDefault(); setMsg(null)
    const { error } = await supabase.from('flights').insert({
      ...form,
      origin_iata: form.origin_iata.toUpperCase(),
      destination_iata: form.destination_iata.toUpperCase(),
      scheduled_departure: form.scheduled_departure || null,
      scheduled_arrival: form.scheduled_arrival || null,
    })
    if (error) setMsg({ t: 'err', m: error.message })
    else { setForm({ flight_number: '', carrier: '', origin_iata: '', destination_iata: '', scheduled_departure: '', scheduled_arrival: '' }); load() }
  }

  const act = async (fn, id, okMsg) => {
    setMsg(null)
    const { error } = await supabase.rpc(fn, { p_flight_id: id })
    if (error) setMsg({ t: 'err', m: error.message })
    else setMsg({ t: 'ok', m: okMsg })
  }

  return (
    <Shell>
      <div className="page-head">
        <div><h1>Flights</h1>
          <div className="sub">
            Departure and landing cascade to every loaded shipment automatically.
            With the flight-sync function deployed this happens from the live airline feed; the buttons below do the same by hand.
          </div></div>
      </div>
      {msg && <div className={`alert ${msg.t}`}>{msg.m}</div>}

      <div className="card">
        <h3>Register flight</h3>
        <form onSubmit={create} className="grid cols-3" style={{ marginTop: 10, alignItems: 'end' }}>
          <label className="field"><span className="lbl">Flight number</span>
            <input required placeholder="6E-1234" value={form.flight_number} onChange={set('flight_number')} /></label>
          <label className="field"><span className="lbl">Carrier</span>
            <input placeholder="IndiGo" value={form.carrier} onChange={set('carrier')} /></label>
          <label className="field"><span className="lbl">Origin IATA</span>
            <input required maxLength={3} placeholder="MAA" value={form.origin_iata} onChange={set('origin_iata')} /></label>
          <label className="field"><span className="lbl">Destination IATA</span>
            <input required maxLength={3} placeholder="DEL" value={form.destination_iata} onChange={set('destination_iata')} /></label>
          <label className="field"><span className="lbl">Scheduled departure</span>
            <input type="datetime-local" value={form.scheduled_departure} onChange={set('scheduled_departure')} /></label>
          <label className="field"><span className="lbl">Scheduled arrival</span>
            <input type="datetime-local" value={form.scheduled_arrival} onChange={set('scheduled_arrival')} /></label>
          <button className="btn">Add flight</button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Flight</th><th>Route</th><th>Departure</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {flights.map((f) => (
              <tr key={f.id}>
                <td className="mono">{f.flight_number}</td>
                <td className="mono">{f.origin_iata} → {f.destination_iata}</td>
                <td className="small">{fmt(f.scheduled_departure)}</td>
                <td><span className="chip">{f.live_status}</span></td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {['SCHEDULED', 'DELAYED'].includes(f.live_status) && (
                    <button className="btn small" onClick={() => act('flight_departed', f.id, `${f.flight_number} departed — shipments now IN_FLIGHT`)}>
                      Mark departed
                    </button>
                  )}
                  {['DEPARTED', 'EN_ROUTE'].includes(f.live_status) && (
                    <button className="btn small dark" onClick={() => act('flight_landed', f.id, `${f.flight_number} landed — shipments now LANDED`)}>
                      Mark landed
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {flights.length === 0 && <p className="muted" style={{ marginTop: 10 }}>No flights registered yet.</p>}
      </div>
    </Shell>
  )
}
