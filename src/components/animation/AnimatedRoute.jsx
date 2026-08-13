import { useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'

// Animated cargo plane / truck route component
// Shows a vehicle moving from origin to destination with progress
export default function AnimatedRoute({ origin = 'MAA', destination = 'DEL', originName = 'Chennai', destName = 'Delhi', progress = 0, vehicle = 'plane', status }) {
  const [displayProgress, setDisplayProgress] = useState(0)
  const isDelivered = status === 'DELIVERED'
  const isTruck = vehicle === 'truck'

  useEffect(() => {
    // Animate progress smoothly
    const timer = setTimeout(() => setDisplayProgress(progress), 300)
    return () => clearTimeout(timer)
  }, [progress])

  const emoji = isTruck ? '🚚' : '✈️'
  const color = isTruck ? 'var(--success)' : 'var(--primary)'
  const glowColor = isTruck ? 'rgba(34,197,94,0.6)' : 'rgba(56,189,248,0.6)'

  return (
    <div style={{ padding: '16px 0' }}>
      {/* City nodes + route */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {/* Origin */}
        <div style={{ textAlign: 'center', minWidth: 70 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, boxShadow: `0 0 12px ${glowColor}`, margin: '0 auto 6px', animation: 'livePulse 2s ease-in-out infinite' }} />
          <div className="route-city">
            <div className="city-code">{origin}</div>
            <div className="city-name">{originName}</div>
          </div>
        </div>

        {/* Route track */}
        <div style={{ flex: 1, position: 'relative', height: 60, display: 'flex', alignItems: 'center' }}>
          {/* Background track */}
          <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'var(--border)', borderRadius: 2 }} />

          {/* Animated progress fill */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            style={{
              position: 'absolute', left: 0, height: 2,
              background: `linear-gradient(90deg, ${color}, ${isTruck ? '#16a34a' : 'var(--secondary)'})`,
              boxShadow: `0 0 8px ${glowColor}`,
              borderRadius: 2,
            }}
          />

          {/* Dashed trail dots */}
          {[20, 40, 60, 80].map(p => (
            <div key={p} style={{
              position: 'absolute',
              left: `${p}%`,
              width: 4, height: 4,
              borderRadius: '50%',
              background: displayProgress >= p ? color : 'var(--border)',
              opacity: displayProgress >= p ? 0.6 : 0.3,
              transition: 'all 0.5s ease',
            }} />
          ))}

          {/* Moving vehicle emoji */}
          <motion.div
            animate={{ left: `${Math.min(displayProgress, 95)}%` }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              fontSize: 22,
              transform: 'translateX(-50%)',
              filter: `drop-shadow(0 0 8px ${glowColor})`,
              zIndex: 2,
              top: '50%',
              marginTop: -14,
            }}
          >
            {isDelivered ? '✅' : emoji}
          </motion.div>
        </div>

        {/* Destination */}
        <div style={{ textAlign: 'center', minWidth: 70 }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%',
            background: isDelivered ? 'var(--success)' : 'var(--border)',
            boxShadow: isDelivered ? '0 0 12px rgba(34,197,94,0.6)' : 'none',
            margin: '0 auto 6px',
            transition: 'all 0.8s ease',
          }} />
          <div className="route-city">
            <div className="city-code" style={{ color: isDelivered ? 'var(--success)' : 'var(--primary)' }}>{destination}</div>
            <div className="city-name">{destName}</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {isTruck ? 'Delivery progress' : 'Flight progress'}
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color, fontWeight: 700 }}>
            {displayProgress}%
          </span>
        </div>
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.2 }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${color}, ${isTruck ? '#16a34a' : 'var(--secondary)'})`,
              boxShadow: `0 0 8px ${glowColor}`,
              borderRadius: 4,
            }}
          />
        </div>
      </div>
    </div>
  )
}
