import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Package, PackagePlus, FileText, Plane, Truck, AlertTriangle, ScanLine, History, Navigation, Bell, Shield, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV = {
  admin: [
    { to: '/ops', icon: LayoutDashboard, label: 'Live board', end: true },
    { to: '/ops/new', icon: PackagePlus, label: 'New shipment' },
    { to: '/ops/manifests', icon: FileText, label: 'Manifests' },
    { to: '/ops/flights', icon: Plane, label: 'Flights' },
    { to: '/ops/dispatch', icon: Truck, label: 'Dispatch' },
    { to: '/ops/exceptions', icon: AlertTriangle, label: 'Exceptions' },
    { to: '/warehouse', icon: ScanLine, label: 'Scanner', end: true },
    { to: '/admin', icon: Shield, label: 'Admin', end: true },
  ],
  ops: [
    { to: '/ops', icon: LayoutDashboard, label: 'Live board', end: true },
    { to: '/ops/new', icon: PackagePlus, label: 'New shipment' },
    { to: '/ops/manifests', icon: FileText, label: 'Manifests' },
    { to: '/ops/flights', icon: Plane, label: 'Flights' },
    { to: '/ops/dispatch', icon: Truck, label: 'Dispatch' },
    { to: '/ops/exceptions', icon: AlertTriangle, label: 'Exceptions' },
  ],
  warehouse: [
    { to: '/warehouse', icon: ScanLine, label: 'Scanner', end: true },
    { to: '/warehouse/recent', icon: History, label: 'Recent scans' },
  ],
  driver: [
    { to: '/driver', icon: Navigation, label: 'My route', end: true },
  ],
  customer: [
    { to: '/my', icon: Package, label: 'My shipments', end: true },
    { to: '/my/notifications', icon: Bell, label: 'Notifications' },
  ],
}

export default function Shell({ children }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const links = NAV[profile?.role] ?? []
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">SPEED<span>COOL</span></div>
          <div className="brand-sub">Logistics Platform</div>
          <div className="live-badge"><span className="live-dot" />LIVE</div>
        </div>
        <nav>
          {links.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}>
              {({ isActive }) => (
                <motion.span style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}
                  animate={isActive ? { x: 2 } : { x: 0 }}>
                  <Icon size={16} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
                  {label}
                </motion.span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="foot">
          <div className="who">{profile?.full_name || 'User'}</div>
          <div className="role">{profile?.role}</div>
          <button onClick={async () => { await signOut(); navigate('/') }}>
            <LogOut size={12} style={{ display: 'inline', marginRight: 5 }} />Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
          {children}
        </motion.div>
      </main>
    </div>
  )
}
