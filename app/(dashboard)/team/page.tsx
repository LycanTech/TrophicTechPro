import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { Users, ShieldCheck, Wrench, Eye } from "lucide-react"

export const metadata: Metadata = { title: "Team" }

const ROLE_CONFIG: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  admin:    { label: "Admin",    color: "text-[#5e5ce6] bg-[rgba(94,92,230,0.15)]",  Icon: ShieldCheck },
  engineer: { label: "Engineer", color: "text-[#0a84ff] bg-[rgba(10,132,255,0.12)]", Icon: Wrench },
  viewer:   { label: "Viewer",   color: "text-[rgba(235,235,245,0.5)] bg-white/[0.07)]", Icon: Eye },
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#5e5ce6,#3634a3)",
  "linear-gradient(135deg,#0a84ff,#0059b3)",
  "linear-gradient(135deg,#30d158,#248a3d)",
  "linear-gradient(135deg,#ff9f0a,#c93400)",
  "linear-gradient(135deg,#ff453a,#c41230)",
  "linear-gradient(135deg,#64d2ff,#0071a4)",
]

async function getTeamMembers() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
}

export default async function TeamPage() {
  const members = await getTeamMembers()
  const adminCount    = members.filter(m => m.role === "admin").length
  const engineerCount = members.filter(m => m.role === "engineer").length

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease_forwards]">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-white">Team</h1>
        <p className="mt-0.5 text-sm text-[rgba(235,235,245,0.5)]">
          {adminCount} admin · {engineerCount} engineer · {members.length} total
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Members", value: members.length,  Icon: Users,       color: "text-[#0a84ff]", bg: "bg-[rgba(10,132,255,0.12)]" },
          { label: "Admins",        value: adminCount,      Icon: ShieldCheck, color: "text-[#5e5ce6]", bg: "bg-[rgba(94,92,230,0.12)]" },
          { label: "Engineers",     value: engineerCount,   Icon: Wrench,      color: "text-[#30d158]", bg: "bg-[rgba(48,209,88,0.12)]" },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="card p-4 flex items-center gap-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
              <Icon className={`w-[18px] h-[18px] ${color}`} />
            </div>
            <div>
              <div className="text-[22px] font-semibold text-white leading-none">{value}</div>
              <div className="text-xs text-[rgba(235,235,245,0.45)] mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Member cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {members.map((member, i) => {
          const cfg = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.viewer
          const RoleIcon = cfg.Icon
          const gradient = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]
          const initial = member.name.charAt(0).toUpperCase()
          const joined = new Date(member.createdAt).toLocaleDateString("en", { month: "short", year: "numeric" })

          return (
            <div
              key={member.id}
              className="card p-5 flex items-start gap-4"
              style={{ animation: `fade-in 0.4s ease ${i * 60}ms both` }}
            >
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[15px] font-semibold text-white flex-shrink-0"
                style={{ background: gradient }}
              >
                {initial}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[15px] text-white truncate">{member.name}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 ${cfg.color}`}>
                    <RoleIcon className="w-2.5 h-2.5" />
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-[rgba(235,235,245,0.4)] mt-0.5 truncate">{member.email}</p>
                <p className="text-[11px] text-[rgba(235,235,245,0.3)] mt-1.5">Joined {joined}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
