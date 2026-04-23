import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "Mission Control — Trophic Tech", template: "%s | Trophic Tech" },
  description: "Internal DevOps platform for Trophic Tech consulting engagements",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  )
}
