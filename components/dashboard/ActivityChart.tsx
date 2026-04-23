"use client"
import type { ActivityDay } from "@/types"

const BAR_W = 32
const GAP = 10
const CHART_H = 72

export function ActivityChart({ data }: { data: ActivityDay[] }) {
  const maxVal = Math.max(...data.map(d => d.total), 1)
  const totalW = data.length * (BAR_W + GAP) - GAP

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[15px] font-semibold text-white">7-Day Activity</h2>
        <div className="flex items-center gap-4 text-[11px] text-[rgba(235,235,245,0.4)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-[#30d158] opacity-80" />
            Success
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-[#ff453a] opacity-80" />
            Failed
          </span>
        </div>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${totalW} ${CHART_H + 20}`}
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
      >
        {data.map((day, i) => {
          const x = i * (BAR_W + GAP)
          const isEmpty = day.total === 0
          const totalH = isEmpty ? 3 : Math.max((day.total / maxVal) * CHART_H, 4)
          const successH = day.total > 0 ? (day.success / day.total) * totalH : 0
          const failedH = totalH - successH

          const label = new Date(day.date + "T12:00:00").toLocaleDateString("en", { weekday: "short" }).slice(0, 3)

          return (
            <g key={day.date}>
              {/* Empty placeholder bar */}
              <rect
                x={x}
                y={CHART_H - 3}
                width={BAR_W}
                height={3}
                rx={2}
                fill="rgba(255,255,255,0.05)"
              />

              {!isEmpty && (
                <>
                  {/* Failed portion (bottom) */}
                  {failedH > 0 && (
                    <rect
                      x={x}
                      y={CHART_H - totalH}
                      width={BAR_W}
                      height={failedH}
                      rx={failedH === totalH ? 4 : 0}
                      fill="#ff453a"
                      opacity={0.8}
                      style={{ animation: `fade-in 0.4s ease ${i * 60}ms both` }}
                    />
                  )}
                  {/* Success portion (top) */}
                  {successH > 0 && (
                    <rect
                      x={x}
                      y={CHART_H - totalH}
                      width={BAR_W}
                      height={successH}
                      rx={4}
                      fill="#30d158"
                      opacity={0.85}
                      style={{ animation: `fade-in 0.4s ease ${i * 60}ms both` }}
                    />
                  )}
                  {/* Count label */}
                  <text
                    x={x + BAR_W / 2}
                    y={CHART_H - totalH - 5}
                    textAnchor="middle"
                    fontSize={9}
                    fill="rgba(235,235,245,0.45)"
                    fontFamily="system-ui,sans-serif"
                  >
                    {day.total}
                  </text>
                </>
              )}

              {/* Day label */}
              <text
                x={x + BAR_W / 2}
                y={CHART_H + 15}
                textAnchor="middle"
                fontSize={9}
                fill="rgba(235,235,245,0.35)"
                fontFamily="system-ui,sans-serif"
              >
                {label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
