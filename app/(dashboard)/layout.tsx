import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Sidebar from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"
import { Providers } from "@/components/providers"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  const notifications = await prisma.deployment.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: { project: { select: { id: true, name: true, client: true } } },
  })

  return (
    <Providers>
      <div className="flex h-dvh bg-black overflow-hidden">
        <Sidebar user={session.user} />
        <div className="flex flex-col flex-1 min-w-0">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Topbar user={session.user} notifications={notifications as any} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </Providers>
  )
}
