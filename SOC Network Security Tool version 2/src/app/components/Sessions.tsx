import { useState } from "react";
import { Network, CheckCircle, Clock, AlertTriangle, XCircle, Search } from "lucide-react";
import type { Session } from "../data/packetData";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const FONT = "'Inter', ui-sans-serif, sans-serif";

const STATE_CONFIG = {
  ESTABLISHED: { color: "#00E893", icon: CheckCircle, bg: "rgba(0,232,147,0.12)",   border: "rgba(0,232,147,0.25)" },
  CLOSED:      { color: "#3D6275", icon: XCircle,    bg: "rgba(61,97,117,0.12)",    border: "rgba(61,97,117,0.2)" },
  SYN_SENT:    { color: "#3D8EFF", icon: Clock,      bg: "rgba(61,142,255,0.12)",   border: "rgba(61,142,255,0.25)" },
  TIME_WAIT:   { color: "#FFAD1F", icon: Clock,      bg: "rgba(255,173,31,0.12)",   border: "rgba(255,173,31,0.25)" },
  LISTENING:   { color: "#9B6EFF", icon: Network,    bg: "rgba(155,110,255,0.12)",  border: "rgba(155,110,255,0.25)" },
};

const PROTO_COLORS: Record<string, string> = {
  TCP: "#3D8EFF", UDP: "#00CFFF", DNS: "#A5B4FC", "TLSv1.3": "#9B6EFF",
  HTTP: "#FFD077", SSH: "#00E893", ICMP: "#FF8098", ARP: "#FDB07D", FTP: "#ECA3FA",
};

type Props = { sessions: Session[] };

export function Sessions({ sessions }: Props) {
  const [filter, setFilter]           = useState("");
  const [stateFilter, setStateFilter] = useState<string | null>(null);

  const filtered = sessions.filter((s) => {
    const matchText  = !filter || `${s.srcIp} ${s.dstIp} ${s.protocol} ${s.dstPort}`.toLowerCase().includes(filter.toLowerCase());
    const matchState = !stateFilter || s.state === stateFilter;
    return matchText && matchState;
  });

  const stateCounts = sessions.reduce((acc, s) => {
    acc[s.state] = (acc[s.state] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto" style={{ height: "100%" }}>
      {/* State filter chips + search */}
      <div className="flex items-center gap-2 flex-wrap">
        <span style={{ color: "#3D6275", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", fontFamily: FONT }}>STATE:</span>
        {Object.entries(stateCounts).map(([state, count]) => {
          const cfg = STATE_CONFIG[state as keyof typeof STATE_CONFIG] ?? { color: "#7EA4C2", bg: "rgba(126,164,194,0.1)", border: "rgba(126,164,194,0.2)" };
          const active = stateFilter === state;
          return (
            <button
              key={state}
              onClick={() => setStateFilter(active ? null : state)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{
                background: active ? cfg.bg : "rgba(13,31,51,0.8)",
                color: active ? cfg.color : "#3D6275",
                border: `1px solid ${active ? cfg.border : "#1C3A56"}`,
                fontSize: 10,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                fontFamily: FONT,
                transition: "all 0.15s ease",
              }}
            >
              {state.replace("_", " ")}
              <span
                className="rounded-full"
                style={{ background: active ? cfg.color : "#1C3A56", color: active ? "#060C16" : "#3D6275", fontSize: 8, fontWeight: 700, minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}
              >
                {count}
              </span>
            </button>
          );
        })}
        <div className="flex-1" />
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: "#0D1F33", border: "1px solid #1C3A56" }}
        >
          <Search size={11} style={{ color: "#3D6275" }} />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search sessions…"
            className="bg-transparent outline-none"
            style={{ color: "#E8F1FF", fontSize: 11, border: "none", width: 180, fontFamily: MONO }}
          />
        </div>
      </div>

      {/* Sessions table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#0D1F33", border: "1px solid #1C3A56" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1C3A56", background: "#08111D" }}>
              {["Source", "Destination", "Protocol", "Dst Port", "Packets", "Bytes", "State", "Started"].map((h) => (
                <th
                  key={h}
                  style={{ padding: "8px 12px", textAlign: "left", color: "#3D6275", fontSize: 9, fontWeight: 700, whiteSpace: "nowrap", letterSpacing: "0.08em", fontFamily: FONT }}
                >
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const cfg        = STATE_CONFIG[s.state] ?? { color: "#7EA4C2", icon: Network, bg: "transparent", border: "transparent" };
              const StateIcon  = cfg.icon;
              const protoColor = PROTO_COLORS[s.protocol] ?? "#7EA4C2";
              return (
                <tr key={s.id} className="soc-row" style={{ borderBottom: "1px solid rgba(28,58,86,0.4)" }}>
                  <td style={{ padding: "7px 12px", color: "#E8F1FF", fontFamily: MONO }}>{s.srcIp}</td>
                  <td style={{ padding: "7px 12px", color: "#E8F1FF", fontFamily: MONO }}>{s.dstIp}</td>
                  <td style={{ padding: "7px 12px" }}>
                    <span
                      className="rounded-md"
                      style={{ background: `${protoColor}20`, color: protoColor, fontSize: 9, fontWeight: 700, padding: "1px 6px", letterSpacing: "0.04em", border: `1px solid ${protoColor}40` }}
                    >
                      {s.protocol}
                    </span>
                  </td>
                  <td style={{ padding: "7px 12px", color: "#7EA4C2", fontFamily: MONO }}>{s.dstPort || "—"}</td>
                  <td style={{ padding: "7px 12px", color: "#E8F1FF", fontFamily: MONO, fontWeight: 600 }}>{s.packetCount}</td>
                  <td style={{ padding: "7px 12px", color: "#7EA4C2", fontFamily: MONO }}>
                    {s.bytes >= 1024 ? `${(s.bytes / 1024).toFixed(1)} KB` : `${s.bytes} B`}
                  </td>
                  <td style={{ padding: "7px 12px" }}>
                    <span className="flex items-center gap-1.5" style={{ color: cfg.color }}>
                      <StateIcon size={10} />
                      <span style={{ fontSize: 10, fontFamily: FONT, fontWeight: 500 }}>{s.state.replace("_", " ")}</span>
                    </span>
                  </td>
                  <td style={{ padding: "7px 12px", color: "#3D6275", fontFamily: MONO, fontSize: 10 }}>{s.startTime}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "#254560", fontSize: 12, fontFamily: FONT }}>
                  No sessions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Sessions",      value: sessions.length,                                                  color: "#3D8EFF",  border: "rgba(61,142,255,0.25)" },
          { label: "Established",         value: stateCounts.ESTABLISHED ?? 0,                                     color: "#00E893",  border: "rgba(0,232,147,0.2)" },
          { label: "Closed / Time-Wait",  value: (stateCounts.CLOSED ?? 0) + (stateCounts.TIME_WAIT ?? 0),         color: "#3D6275",  border: "#1C3A56" },
        ].map((item) => (
          <div
            key={item.label}
            className="soc-card rounded-xl p-3"
            style={{ background: "#0D1F33", border: `1px solid ${item.border}` }}
          >
            <div style={{ color: "#3D6275", fontSize: 10, fontFamily: FONT, fontWeight: 600, letterSpacing: "0.04em" }}>{item.label.toUpperCase()}</div>
            <div style={{ color: item.color, fontSize: 22, fontWeight: 700, fontFamily: MONO, marginTop: 4, letterSpacing: "-0.02em" }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
