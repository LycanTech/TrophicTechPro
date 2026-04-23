"use client"
import { ToastProvider } from "@/components/ui/Toast"
import { CommandPalette } from "@/components/ui/CommandPalette"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <CommandPalette />
    </ToastProvider>
  )
}
