import { useState } from "react";
import { Network, CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react";
import type { Session } from "../data/packetData";

const STATE_CONFIG = {
  ESTABLISHED: { color: "#4ADE80", icon: CheckCircle, bg: "rgba(34,197,94,0.15)" },
  CLOSED:      { color: "#64748B", icon: XCircle,     bg: "rgba(100,116,139,0.15)" },
  SYN_SENT:    { color: "#60A5FA", icon: Clock,        bg: "rgba(59,130,246,0.15)" },
  TIME_WAIT:   { color: "#FCD34D", icon: Clock,        bg: "rgba(245,158,11,0.15)" },
  LISTENING:   { color: "#A78BFA", icon: Network,      bg: "rgba(139,92,246,0.15)" },
};

const PROTO_COLORS: Record<string, string> = {
  TCP: "#60A5FA", UDP: "#67E8F9", DNS: "#818CF8", "TLSv1.3": "#A78BFA",
  HTTP: "#FCD34D", SSH: "#4ADE80", ICMP: "#F87171", ARP: "#FB923C", FTP: "#E879F9",
};

type Props = { sessions: Session[] };

export function Sessions({ sessions }: Props) {
  const [filter, setFilter] = useState("");
  const [stateFilter, setStateFilter] = useState<string | null>(null);

  const filtered = sessions.filter((s) => {
    const matchText = !filter || `${s.srcIp} ${s.dstIp} ${s.protocol} ${s.dstPort}`.toLowerCase().includes(filter.toLowerCase());
    const matchState = !stateFilter || s.state === stateFilter;
    return matchText && matchState;
  });

  const stateCounts = sessions.reduce((acc, s) => {
    acc[s.state] = (acc[s.state] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto" style={{ height: "100%" }}>
      {/* State filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span style={{ color: "#64748B", fontSize: 11, fontWeight: 600 }}>FILTER BY STATE:</span>
        {Object.entries(stateCounts).map(([state, count]) => {
          const cfg = STATE_CONFIG[state as keyof typeof STATE_CONFIG];
          const active = stateFilter === state;
          return (
            <button
              key={state}
              onClick={() => setStateFilter(active ? null : state)}
              className="flex items-center gap-1 px-2 py-1 rounded"
              style={{
                background: active ? cfg.bg : "rgba(30,41,59,0.8)",
                color: active ? cfg.color : "#64748B",
                border: `1px solid ${active ? cfg.color + "50" : "#334155"}`,
                fontSize: 11, cursor: "pointer",
              }}
            >
              {state} ({count})
            </button>
          );
        })}
        <div className="flex-1" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search sessions..."
          className="px-2 py-1 rounded"
          style={{ background: "#1E293B", border: "1px solid #334155", color: "#CBD5E1", fontSize: 12, outline: "none", width: 200 }}
        />
      </div>

      {/* Sessions table */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#1E293B", border: "1px solid #334155" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #334155", background: "#0F172A" }}>
              {["Source", "Destination", "Protocol", "Dst Port", "Packets", "Bytes", "State", "Started"].map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#64748B", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const cfg = STATE_CONFIG[s.state];
              const StateIcon = cfg.icon;
              const protoColor = PROTO_COLORS[s.protocol] ?? "#94A3B8";
              return (
                <tr key={s.id} style={{ borderBottom: "1px solid rgba(51,65,85,0.5)" }}>
                  <td style={{ padding: "8px 12px", color: "#CBD5E1", fontFamily: "monospace" }}>{s.srcIp}</td>
                  <td style={{ padding: "8px 12px", color: "#CBD5E1", fontFamily: "monospace" }}>{s.dstIp}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <span className="px-1.5 py-0.5 rounded" style={{ background: `${protoColor}22`, color: protoColor, fontSize: 10, fontWeight: 700 }}>{s.protocol}</span>
                  </td>
                  <td style={{ padding: "8px 12px", color: "#94A3B8", fontFamily: "monospace" }}>{s.dstPort || "—"}</td>
                  <td style={{ padding: "8px 12px", color: "#F8FAFC", fontFamily: "monospace", fontWeight: 600 }}>{s.packetCount}</td>
                  <td style={{ padding: "8px 12px", color: "#94A3B8", fontFamily: "monospace" }}>
                    {s.bytes >= 1024 ? `${(s.bytes / 1024).toFixed(1)} KB` : `${s.bytes} B`}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <span className="flex items-center gap-1" style={{ color: cfg.color }}>
                      <StateIcon size={11} />
                      <span style={{ fontSize: 11 }}>{s.state.replace("_", " ")}</span>
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", color: "#64748B", fontFamily: "monospace", fontSize: 11 }}>{s.startTime}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "#475569", fontSize: 13 }}>No sessions found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Session summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Sessions", value: sessions.length, color: "#60A5FA" },
          { label: "Established", value: stateCounts.ESTABLISHED ?? 0, color: "#4ADE80" },
          { label: "Closed / Time-Wait", value: (stateCounts.CLOSED ?? 0) + (stateCounts.TIME_WAIT ?? 0), color: "#64748B" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg p-3" style={{ background: "#1E293B", border: "1px solid #334155" }}>
            <div style={{ color: "#64748B", fontSize: 11 }}>{item.label}</div>
            <div style={{ color: item.color, fontSize: 22, fontWeight: 700, fontFamily: "monospace", marginTop: 4 }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
