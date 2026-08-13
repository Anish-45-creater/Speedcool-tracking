import { motion } from 'framer-motion'
import { STAGES, stageIndex } from '../lib/constants'

export default function Stepper({ status }) {
  const idx = stageIndex(status)
  const delivered = status === 'DELIVERED'
  return (
    <div className="stepper">
      {STAGES.map((s, i) => {
        const done = delivered || i < idx
        const now = !delivered && i === idx
        return (
          <motion.div key={s.name} className={`step ${done ? 'done' : ''} ${now ? 'now' : ''}`}
            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}>
            <div className="dot">{done ? '✓' : i + 1}</div>
            <div className="nm">{s.name}</div>
          </motion.div>
        )
      })}
    </div>
  )
}
