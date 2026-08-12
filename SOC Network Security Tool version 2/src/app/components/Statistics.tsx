import type { ReactNode } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import type { Stats } from "../data/packetData";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const FONT = "'Inter', ui-sans-serif, sans-serif";
const TOOLTIP = { background: "#0D1F33", border: "1px solid #1C3A56", borderRadius: 8, color: "#E8F1FF", fontSize: 11, fontFamily: FONT };

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "#0D1F33", border: "1px solid #1C3A56" }}>
      <div className="flex items-center gap-2">
        <div style={{ width: 3, height: 14, background: "linear-gradient(180deg,#3D8EFF,#9B6EFF)", borderRadius: 2 }} />
        <h3 style={{ color: "#E8F1FF", fontSize: 12, fontWeight: 600, margin: 0, fontFamily: FONT }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid rgba(28,58,86,0.5)" }}>
      <span style={{ color: "#7EA4C2", fontSize: 11, fontFamily: FONT }}>{label}</span>
      <span style={{ color: color ?? "#E8F1FF", fontSize: 11, fontWeight: 700, fontFamily: MONO }}>{value}</span>
    </div>
  );
}

type Props = { stats: Stats; totalPackets: number };

export function Statistics({ stats, totalPackets }: Props) {
  const totalKB = (stats.totalBytes / 1024).toFixed(1);
  const totalMB = (stats.totalBytes / 1024 / 1024).toFixed(2);

  const summaryCards = [
    { label: "Total Packets",    value: totalPackets.toLocaleString(), color: "#3D8EFF",  accent: "rgba(61,142,255,0.12)",  border: "rgba(61,142,255,0.25)" },
    { label: "Total Data",       value: `${totalMB} MB`,               color: "#9B6EFF",  accent: "rgba(155,110,255,0.1)",  border: "rgba(155,110,255,0.25)" },
    { label: "Avg Packet Size",  value: `${stats.avgPacketSize} B`,     color: "#00E893",  accent: "rgba(0,232,147,0.08)",   border: "rgba(0,232,147,0.2)" },
    { label: "Active Protocols", value: String(stats.protocolCounts.length), color: "#FFD077", accent: "rgba(255,208,119,0.1)", border: "rgba(255,208,119,0.25)" },
  ];

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto" style={{ height: "100%" }}>
      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        {summaryCards.map((s) => (
          <div
            key={s.label}
            className="soc-card rounded-xl p-3 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, #0D1F33 0%, ${s.accent} 100%)`, border: `1px solid ${s.border}` }}
          >
            <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${s.color},transparent)`, position: "absolute", top: 0, left: 0, right: 0 }} />
            <div style={{ color: "#7EA4C2", fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", fontFamily: FONT }}>{s.label.toUpperCase()}</div>
            <div style={{ color: s.color, fontSize: 20, fontWeight: 700, fontFamily: MONO, marginTop: 6, letterSpacing: "-0.02em" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Protocol Distribution */}
        <Card title="Protocol Distribution">
          <div className="flex gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={stats.protocolCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} strokeWidth={0}>
                  {stats.protocolCounts.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP} formatter={(v, n) => [`${v} pkts`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 justify-center flex-1 overflow-hidden">
              {stats.protocolCounts.map((p) => {
                const pct = totalPackets > 0 ? ((p.value / totalPackets) * 100).toFixed(1) : "0";
                return (
                  <div key={p.name} className="flex items-center gap-2">
                    <div className="rounded-full" style={{ width: 7, height: 7, background: p.color, flexShrink: 0, boxShadow: `0 0 6px ${p.color}80` }} />
                    <span style={{ color: "#7EA4C2", fontSize: 10, flex: 1, fontFamily: FONT }}>{p.name}</span>
                    <span style={{ color: "#E8F1FF", fontSize: 10, fontFamily: MONO }}>{p.value}</span>
                    <span style={{ color: "#3D6275", fontSize: 9, fontFamily: MONO, width: 36, textAlign: "right" }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Traffic Timeline */}
        <Card title="Traffic Over Time (packets/sec)">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={stats.timeline} margin={{ left: -20, right: 5, top: 5, bottom: 0 }}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="rgba(28,58,86,0.6)" />
              <XAxis key="x" dataKey="time" stroke="#1C3A56" tick={{ fill: "#3D6275", fontSize: 9, fontFamily: MONO }} interval="preserveStartEnd" />
              <YAxis key="y" stroke="#1C3A56" tick={{ fill: "#3D6275", fontSize: 9, fontFamily: MONO }} />
              <Tooltip key="tip" contentStyle={TOOLTIP} />
              <Line key="line" type="monotone" dataKey="packets" stroke="#3D8EFF" strokeWidth={2} dot={false} name="Packets"
                style={{ filter: "drop-shadow(0 0 6px rgba(61,142,255,0.5))" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Top Source IPs */}
        <Card title="Top Source IPs">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.topSources.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="rgba(28,58,86,0.6)" horizontal={false} />
              <XAxis key="x" type="number" stroke="#1C3A56" tick={{ fill: "#3D6275", fontSize: 9, fontFamily: MONO }} />
              <YAxis key="y" type="category" dataKey="ip" stroke="#1C3A56" tick={{ fill: "#7EA4C2", fontSize: 9, fontFamily: MONO }} width={110} />
              <Tooltip key="tip" contentStyle={TOOLTIP} formatter={(v) => [`${v} pkts`, "Packets"]} />
              <Bar key="bar" dataKey="packets" fill="#3D8EFF" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Dest IPs */}
        <Card title="Top Destination IPs">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.topDests.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="rgba(28,58,86,0.6)" horizontal={false} />
              <XAxis key="x" type="number" stroke="#1C3A56" tick={{ fill: "#3D6275", fontSize: 9, fontFamily: MONO }} />
              <YAxis key="y" type="category" dataKey="ip" stroke="#1C3A56" tick={{ fill: "#7EA4C2", fontSize: 9, fontFamily: MONO }} width={110} />
              <Tooltip key="tip" contentStyle={TOOLTIP} formatter={(v) => [`${v} pkts`, "Packets"]} />
              <Bar key="bar" dataKey="packets" fill="#9B6EFF" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Data volume by source */}
      <Card title="Data Volume by Source IP (bytes transferred)">
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={stats.topSources.slice(0, 8)} margin={{ left: -20, right: 5, top: 5, bottom: 0 }}>
            <CartesianGrid key="grid" strokeDasharray="3 3" stroke="rgba(28,58,86,0.6)" />
            <XAxis key="x" dataKey="ip" stroke="#1C3A56" tick={{ fill: "#3D6275", fontSize: 9, fontFamily: MONO }} />
            <YAxis key="y" stroke="#1C3A56" tick={{ fill: "#3D6275", fontSize: 9, fontFamily: MONO }} />
            <Tooltip key="tip" contentStyle={TOOLTIP} formatter={(v) => [`${Number(v).toLocaleString()} B`, "Bytes"]} />
            <Bar key="bar" dataKey="bytes" fill="#00E893" radius={[3, 3, 0, 0]} name="Bytes" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
