import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Phone, ArrowRight, LogIn } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ROLE_HOME } from '../lib/constants'

export default function Login() {
  const { session, profile } = useAuth()
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' })
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const swap = (m) => (e) => { e.preventDefault(); setMode(m); setMsg(null) }

  useEffect(() => {
    if (session && profile) navigate(ROLE_HOME[profile.role] ?? '/my', { replace: true })
  }, [session, profile])

  const goHome = async (userId) => {
    const { data: p } = await supabase.from('profiles').select('role').eq('id', userId).single()
    navigate(ROLE_HOME[p?.role] ?? '/my')
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setMsg(null)
    if (mode === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password })
      if (error) setMsg({ t: 'err', m: error.message })
      else await goHome(data.user.id)
    } else if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(), password: form.password,
        options: { data: { full_name: form.full_name, phone: form.phone } },
      })
      if (error) setMsg({ t: 'err', m: error.message })
      else if (!data.session) setMsg({ t: 'ok', m: 'Account created! Check your email or sign in directly.' })
      else await goHome(data.user.id)
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim())
      if (error) setMsg({ t: 'err', m: error.message })
      else setMsg({ t: 'ok', m: 'Reset link sent — check your email.' })
    }
    setBusy(false)
  }

  return (
    <div className="auth-wrap">
      {/* Animated background orbs */}
      <motion.div animate={{ scale: [1,1.3,1], opacity: [0.3,0.6,0.3] }} transition={{ duration: 6, repeat: Infinity }}
        style={{ position: 'absolute', top: '20%', left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,189,248,0.06),transparent)', pointerEvents: 'none' }} />
      <motion.div animate={{ scale: [1,1.2,1], opacity: [0.2,0.5,0.2] }} transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        style={{ position: 'absolute', bottom: '20%', right: '20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(129,140,248,0.06),transparent)', pointerEvents: 'none' }} />

      <div className="auth-card">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="auth-brand">SPEED<span>COOL</span></div>
          <div className="auth-sub">
            {mode === 'signin' ? 'Sign in to your console'
              : mode === 'signup' ? 'Create a customer account'
              : 'Reset your password'}
          </div>
          <div className="card">
            {msg && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`alert ${msg.t}`}>
                {msg.m}
              </motion.div>
            )}
            <form onSubmit={submit}>
              {mode === 'signup' && (
                <>
                  <label className="field">
                    <span className="lbl">Full name</span>
                    <input required value={form.full_name} onChange={set('full_name')} placeholder="Your name" />
                  </label>
                  <label className="field">
                    <span className="lbl">Phone</span>
                    <input value={form.phone} onChange={set('phone')} placeholder="+91…" />
                  </label>
                </>
              )}
              <label className="field">
                <span className="lbl">Email</span>
                <input type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" autoCapitalize="none" />
              </label>
              {mode !== 'forgot' && (
                <label className="field">
                  <span className="lbl">Password</span>
                  <input type="password" required={mode !== 'forgot'} minLength={6} value={form.password} onChange={set('password')} placeholder="••••••••" />
                </label>
              )}
              <button className="btn" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
                {busy ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%' }} />
                ) : mode === 'signin' ? <><LogIn size={15} />Sign in</>
                  : mode === 'signup' ? <><ArrowRight size={15} />Create account</>
                  : <><Mail size={15} />Send reset link</>}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {mode === 'signin' ? (
                <>
                  <a href="#" onClick={swap('signup')} style={{ fontSize: 13, color: 'var(--primary)' }}>New customer? Create an account</a>
                  <a href="#" onClick={swap('forgot')} style={{ fontSize: 12, color: 'var(--text-muted)' }}>Forgot password?</a>
                </>
              ) : (
                <a href="#" onClick={swap('signin')} style={{ fontSize: 13, color: 'var(--primary)' }}>Already registered? Sign in</a>
              )}
              <Link to="/" style={{ fontSize: 12, color: 'var(--text-muted)' }}>← Back to tracking</Link>
            </div>
            <p className="small muted" style={{ textAlign: 'center', marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              Staff accounts are promoted by your admin. Sign up with your email then ask admin to set your role.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
