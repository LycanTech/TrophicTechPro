"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { Search, Rocket, FolderKanban, ArrowRight, Loader2 } from "lucide-react"
import { useKeyboard } from "@/hooks/useKeyboard"
import { useRouter } from "next/navigation"

interface SearchResult {
  id: string
  type: "deployment" | "project"
  title: string
  subtitle: string
  href: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => setMounted(true), [])
  useKeyboard({ key: "k", meta: true }, () => setOpen(o => !o))

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else { setQuery(""); setResults([]); setActive(0) }
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    setLoading(true)
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.ok) setResults(await res.json())
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => clearTimeout(timeout)
  }, [query])

  const go = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === "Enter" && results[active]) go(results[active].href)
    if (e.key === "Escape") setOpen(false)
  }, [results, active, go])

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={() => setOpen(false)}
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      />

      {/* Palette panel */}
      <div
        className="relative w-full max-w-[560px] mx-4 rounded-2xl overflow-hidden"
        style={{
          background: "#1c1c1e",
          border: "0.5px solid rgba(255,255,255,0.12)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.72), 0 0 0 0.5px rgba(255,255,255,0.06)",
          animation: "scale-in 0.18s cubic-bezier(0.34,1.56,0.64,1) forwards",
        }}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
          {loading
            ? <Loader2 className="w-4 h-4 text-[rgba(235,235,245,0.3)] flex-shrink-0 animate-spin" />
            : <Search className="w-4 h-4 text-[rgba(235,235,245,0.3)] flex-shrink-0" />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActive(0) }}
            onKeyDown={onKeyDown}
            placeholder="Search projects, deployments…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[rgba(235,235,245,0.3)] outline-none"
          />
          <kbd
            className="px-1.5 py-0.5 rounded text-[10px] font-medium text-[rgba(235,235,245,0.3)]"
            style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.08)" }}
          >
            ESC
          </kbd>
        </div>

        {/* Results list */}
        {results.length > 0 && (
          <div className="py-1.5 max-h-[320px] overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={r.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.href)}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors duration-75 text-left"
                style={{ background: i === active ? "rgba(255,255,255,0.06)" : "transparent" }}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  r.type === "project" ? "bg-[rgba(94,92,230,0.2)]" : "bg-[rgba(10,132,255,0.15)]"
                }`}>
                  {r.type === "project"
                    ? <FolderKanban className="w-3.5 h-3.5 text-[#5e5ce6]" />
                    : <Rocket className="w-3.5 h-3.5 text-[#0a84ff]" />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white font-medium truncate">{r.title}</div>
                  <div className="text-xs text-[rgba(235,235,245,0.4)] truncate mt-0.5">{r.subtitle}</div>
                </div>
                {i === active && <ArrowRight className="w-3.5 h-3.5 text-[rgba(235,235,245,0.3)] flex-shrink-0" />}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {query && !loading && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[rgba(235,235,245,0.3)]">
            No results for &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Footer hints */}
        <div
          className="flex items-center gap-4 px-4 py-2.5 text-[11px] text-[rgba(235,235,245,0.28)]"
          style={{ borderTop: results.length > 0 || (query && !loading) ? "0.5px solid rgba(255,255,255,0.06)" : undefined }}
        >
          {[
            { keys: "↑↓", label: "navigate" },
            { keys: "↵", label: "open" },
            { keys: "⌘K", label: "close" },
          ].map(({ keys, label }) => (
            <span key={label} className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded text-[10px]"
                   style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                {keys}
              </kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
