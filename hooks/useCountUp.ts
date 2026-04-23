"use client"
import { useState, useEffect, useRef } from "react"

export function useCountUp(target: number, duration = 1000, delay = 0) {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    setValue(0)
    startRef.current = 0

    const timeout = setTimeout(() => {
      const animate = (ts: number) => {
        if (!startRef.current) startRef.current = ts
        const progress = Math.min((ts - startRef.current) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)   // ease-out cubic
        setValue(Math.round(eased * target))
        if (progress < 1) frameRef.current = requestAnimationFrame(animate)
      }
      frameRef.current = requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(timeout)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, duration, delay])

  return value
}
