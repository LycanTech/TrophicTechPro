"use client"
import { useEffect, useCallback } from "react"

interface KeyCombo {
  key: string
  meta?: boolean   // Cmd on Mac, Ctrl on Win — both accepted
  shift?: boolean
}

export function useKeyboard(combo: KeyCombo, callback: () => void) {
  const handler = useCallback((e: KeyboardEvent) => {
    const metaOk = combo.meta ? (e.metaKey || e.ctrlKey) : !(e.metaKey || e.ctrlKey)
    const shiftOk = combo.shift ? e.shiftKey : !e.shiftKey
    if (e.key.toLowerCase() === combo.key.toLowerCase() && metaOk && shiftOk) {
      e.preventDefault()
      callback()
    }
  }, [combo.key, combo.meta, combo.shift, callback])

  useEffect(() => {
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handler])
}
