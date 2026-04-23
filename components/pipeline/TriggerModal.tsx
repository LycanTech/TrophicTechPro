"use client"
import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { useToast } from "@/components/ui/Toast"
import { useRouter } from "next/navigation"
import { Loader2, Rocket } from "lucide-react"

interface Project { id: string; name: string; client: string }

interface Props {
  isOpen: boolean
  onClose: () => void
}

const ENVIRONMENTS = ["staging", "production"] as const

export function TriggerModal({ isOpen, onClose }: Props) {
  const toast = useToast()
  const router = useRouter()

  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState("")
  const [branch, setBranch] = useState("main")
  const [environment, setEnvironment] = useState<"staging" | "production">("staging")
  const [submitting, setSubmitting] = useState(false)

  // Fetch projects when modal opens
  useEffect(() => {
    if (!isOpen) return
    fetch("/api/projects")
      .then(r => r.json())
      .then((data: Project[]) => {
        setProjects(data)
        if (data.length > 0 && !projectId) setProjectId(data[0].id)
      })
      .catch(() => toast.error("Failed to load projects"))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId || !branch.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/deployments/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, branch: branch.trim(), environment }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Request failed")
      }

      toast.success("Deployment triggered", `${environment} · ${branch}`)
      router.refresh()
      onClose()
    } catch (err) {
      toast.error("Failed to trigger deployment", err instanceof Error ? err.message : undefined)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trigger Deployment" subtitle="Queue a new pipeline run" maxWidth={480}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Project */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[rgba(235,235,245,0.55)]">Project</label>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            required
            className="input appearance-none"
          >
            <option value="" disabled>Select a project…</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name} — {p.client}</option>
            ))}
          </select>
        </div>

        {/* Branch */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[rgba(235,235,245,0.55)]">Branch</label>
          <input
            value={branch}
            onChange={e => setBranch(e.target.value)}
            placeholder="main"
            required
            className="input font-mono"
          />
        </div>

        {/* Environment */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[rgba(235,235,245,0.55)]">Environment</label>
          <div className="grid grid-cols-2 gap-2">
            {ENVIRONMENTS.map(env => (
              <button
                key={env}
                type="button"
                onClick={() => setEnvironment(env)}
                className="py-2.5 rounded-[10px] text-sm font-medium capitalize transition-all duration-150"
                style={{
                  background: environment === env
                    ? env === "production" ? "rgba(10,132,255,0.2)" : "rgba(255,255,255,0.08)"
                    : "rgba(255,255,255,0.04)",
                  border: environment === env
                    ? env === "production" ? "0.5px solid rgba(10,132,255,0.5)" : "0.5px solid rgba(255,255,255,0.15)"
                    : "0.5px solid rgba(255,255,255,0.06)",
                  color: environment === env
                    ? env === "production" ? "#409cff" : "#fff"
                    : "rgba(235,235,245,0.4)",
                }}
              >
                {env}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[10px] text-sm font-medium text-[rgba(235,235,245,0.5)] hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.08)" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !projectId}
            className="flex-1 btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Rocket className="w-4 h-4" />
            }
            {submitting ? "Triggering…" : "Trigger Run"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
