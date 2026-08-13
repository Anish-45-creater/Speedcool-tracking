import { useEffect, useRef, useState } from 'react'

export default function AnimatedCounter({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef(null)
  const startValueRef = useRef(0)

  useEffect(() => {
    const target = Number(value) || 0
    const start = startValueRef.current
    const startTime = performance.now()

    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (target - start) * eased)
      setDisplay(current)
      if (progress < 1) startRef.current = requestAnimationFrame(animate)
      else startValueRef.current = target
    }

    if (startRef.current) cancelAnimationFrame(startRef.current)
    startRef.current = requestAnimationFrame(animate)
    return () => { if (startRef.current) cancelAnimationFrame(startRef.current) }
  }, [value, duration])

  return <>{display.toLocaleString('en-IN')}</>
}
