import type { ReactNode } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import type { Stats } from "../data/packetData";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: "#1E293B", border: "1px solid #334155" }}>
      <h3 style={{ color: "#F8FAFC", fontSize: 13, fontWeight: 600, margin: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1" style={{ borderBottom: "1px solid rgba(51,65,85,0.5)" }}>
      <span style={{ color: "#94A3B8", fontSize: 12 }}>{label}</span>
      <span style={{ color: color ?? "#F8FAFC", fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>{value}</span>
    </div>
  );
}

const TOOLTIP_STYLE = { background: "#1E293B", border: "1px solid #334155", borderRadius: 6, color: "#F8FAFC", fontSize: 11 };

type Props = { stats: Stats; totalPackets: number };

export function Statistics({ stats, totalPackets }: Props) {
  const totalKB = (stats.totalBytes / 1024).toFixed(1);
  const totalMB = (stats.totalBytes / 1024 / 1024).toFixed(2);

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto" style={{ height: "100%" }}>
      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Packets", value: totalPackets.toLocaleString(), color: "#60A5FA" },
          { label: "Total Data", value: `${totalMB} MB`, color: "#A78BFA" },
          { label: "Avg Packet Size", value: `${stats.avgPacketSize} B`, color: "#34D399" },
          { label: "Active Protocols", value: String(stats.protocolCounts.length), color: "#FCD34D" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg p-3" style={{ background: "#1E293B", border: "1px solid #334155" }}>
            <div style={{ color: "#64748B", fontSize: 11 }}>{s.label}</div>
            <div style={{ color: s.color, fontSize: 20, fontWeight: 700, fontFamily: "monospace", marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Protocol Distribution */}
        <Card title="Protocol Distribution">
          <div className="flex gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={stats.protocolCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                  {stats.protocolCounts.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [`${v} pkts`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1 justify-center flex-1 overflow-hidden">
              {stats.protocolCounts.map((p) => {
                const pct = totalPackets > 0 ? ((p.value / totalPackets) * 100).toFixed(1) : "0";
                return (
                  <div key={p.name} className="flex items-center gap-2">
                    <div className="rounded-full" style={{ width: 8, height: 8, background: p.color, flexShrink: 0 }} />
                    <span style={{ color: "#94A3B8", fontSize: 11, flex: 1 }}>{p.name}</span>
                    <span style={{ color: "#F8FAFC", fontSize: 11, fontFamily: "monospace" }}>{p.value}</span>
                    <span style={{ color: "#64748B", fontSize: 10, fontFamily: "monospace", width: 36, textAlign: "right" }}>{pct}%</span>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#475569" tick={{ fill: "#64748B", fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis stroke="#475569" tick={{ fill: "#64748B", fontSize: 10 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="packets" stroke="#60A5FA" strokeWidth={2} dot={false} name="Packets" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Top Source IPs */}
        <Card title="Top Source IPs">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.topSources.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#475569" tick={{ fill: "#64748B", fontSize: 10 }} />
              <YAxis type="category" dataKey="ip" stroke="#475569" tick={{ fill: "#94A3B8", fontSize: 10 }} width={110} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} pkts`, "Packets"]} />
              <Bar dataKey="packets" fill="#60A5FA" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Dest IPs */}
        <Card title="Top Destination IPs">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.topDests.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#475569" tick={{ fill: "#64748B", fontSize: 10 }} />
              <YAxis type="category" dataKey="ip" stroke="#475569" tick={{ fill: "#94A3B8", fontSize: 10 }} width={110} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} pkts`, "Packets"]} />
              <Bar dataKey="packets" fill="#A78BFA" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Data volume by source */}
      <Card title="Data Volume by Source IP (bytes transferred)">
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={stats.topSources.slice(0, 8)} margin={{ left: -20, right: 5, top: 5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="ip" stroke="#475569" tick={{ fill: "#64748B", fontSize: 9 }} />
            <YAxis stroke="#475569" tick={{ fill: "#64748B", fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${Number(v).toLocaleString()} B`, "Bytes"]} />
            <Bar dataKey="bytes" fill="#34D399" radius={[3, 3, 0, 0]} name="Bytes" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
