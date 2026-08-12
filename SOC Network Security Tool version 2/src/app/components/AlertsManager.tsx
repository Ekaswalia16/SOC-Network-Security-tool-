import { useState } from "react";
import { ShieldAlert, AlertTriangle, Info, CheckCircle, X, Eye, Download, ArrowUpCircle, Filter, Shield } from "lucide-react";
import { toast } from "sonner";
import type { Alert } from "../data/packetData";

const FONT = "'Inter', ui-sans-serif, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

const SEV_CONFIG = {
  critical: { color: "#FF8098", bg: "rgba(255,53,83,0.1)",   border: "rgba(255,53,83,0.3)",   icon: ShieldAlert,    label: "CRITICAL", dim: "rgba(255,53,83,0.05)",  leftBar: "#FF3553" },
  warn:     { color: "#FFD077", bg: "rgba(255,173,31,0.1)",  border: "rgba(255,173,31,0.3)",  icon: AlertTriangle,  label: "WARNING",  dim: "rgba(255,173,31,0.04)", leftBar: "#FFAD1F" },
  info:     { color: "#7AB8FF", bg: "rgba(61,142,255,0.1)",  border: "rgba(61,142,255,0.3)",  icon: Info,           label: "INFO",     dim: "rgba(61,142,255,0.04)", leftBar: "#3D8EFF" },
};

type Props = { alerts: Alert[]; onDismiss: (id: number) => void };

export function AlertsManager({ alerts, onDismiss }: Props) {
  const [sevFilter, setSevFilter]       = useState<string | null>(null);
  const [showDismissed, setShowDismissed] = useState(false);

  const visible = alerts.filter((a) => {
    if (!showDismissed && a.dismissed) return false;
    if (sevFilter && a.severity !== sevFilter) return false;
    return true;
  });

  const counts = { critical: 0, warn: 0, info: 0 };
  for (const a of alerts.filter((a) => !a.dismissed)) counts[a.severity]++;

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto" style={{ height: "100%" }}>

      {/* ── Summary tiles ── */}
      <div className="grid grid-cols-3 gap-3">
        {(["critical", "warn", "info"] as const).map((sev) => {
          const cfg  = SEV_CONFIG[sev];
          const Icon = cfg.icon;
          const isActive = sevFilter === sev;
          return (
            <button
              key={sev}
              onClick={() => setSevFilter(isActive ? null : sev)}
              className="soc-card rounded-xl p-3 text-left relative overflow-hidden"
              style={{
                background: isActive ? cfg.bg : "#0D1F33",
                border: `1px solid ${isActive ? cfg.border : "#1C3A56"}`,
                cursor: "pointer",
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: isActive ? cfg.leftBar : "transparent", borderRadius: "12px 0 0 12px" }} />
              <div className="flex items-center gap-2 mb-1" style={{ paddingLeft: 4 }}>
                <Icon size={13} style={{ color: cfg.color }} />
                <span style={{ color: "#7EA4C2", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", fontFamily: FONT }}>{cfg.label}</span>
              </div>
              <div
                style={{ color: cfg.color, fontSize: 24, fontWeight: 700, fontFamily: MONO, marginLeft: 4,
                  textShadow: counts[sev] > 0 ? `0 0 20px ${cfg.leftBar}60` : "none",
                  ...(sev === "critical" && counts[sev] > 0 ? { animation: "threat-pulse 2s ease-in-out infinite" } : {})
                }}
              >
                {counts[sev]}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Controls bar ── */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#0D1F33", border: "1px solid #1C3A56" }}>
        <Shield size={12} style={{ color: "#3D6275" }} />
        <span style={{ color: "#3D6275", fontSize: 11, fontFamily: FONT }}>
          <span style={{ color: "#E8F1FF", fontWeight: 600 }}>{visible.length}</span> alert{visible.length !== 1 ? "s" : ""} shown
        </span>
        <div className="flex-1" />
        <button
          onClick={() => setShowDismissed((v) => !v)}
          className="soc-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{
            background: showDismissed ? "rgba(61,97,117,0.2)" : "transparent",
            border: "1px solid #1C3A56",
            color: showDismissed ? "#7EA4C2" : "#3D6275",
            fontSize: 11,
            cursor: "pointer",
            fontFamily: FONT,
          }}
        >
          <Filter size={10} /> {showDismissed ? "Hide" : "Show"} dismissed
        </button>
        {sevFilter && (
          <button
            onClick={() => setSevFilter(null)}
            className="soc-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{ background: "transparent", border: "1px solid #1C3A56", color: "#3D6275", fontSize: 11, cursor: "pointer", fontFamily: FONT }}
          >
            <X size={10} /> Clear filter
          </button>
        )}
      </div>

      {/* ── Alert cards ── */}
      <div className="flex flex-col gap-3">
        {visible.map((alert) => {
          const cfg  = SEV_CONFIG[alert.severity];
          const Icon = cfg.icon;
          return (
            <div
              key={alert.id}
              className="rounded-xl overflow-hidden"
              style={{
                border: `1px solid ${alert.dismissed ? "#1C3A56" : cfg.border}`,
                opacity: alert.dismissed ? 0.5 : 1,
                ...(alert.severity === "critical" && !alert.dismissed ? { animation: "border-glow 3s ease-in-out infinite" } : {}),
              }}
            >
              {/* Left severity bar */}
              <div style={{ display: "flex" }}>
                <div style={{ width: 3, background: alert.dismissed ? "#1C3A56" : cfg.leftBar, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  {/* Alert header */}
                  <div
                    className="flex items-center gap-3 px-4 py-2.5"
                    style={{ background: alert.dismissed ? "#0A1728" : cfg.bg, borderBottom: `1px solid ${alert.dismissed ? "#1C3A56" : cfg.border}` }}
                  >
                    <Icon size={14} style={{ color: alert.dismissed ? "#3D6275" : cfg.color, flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <div style={{ color: alert.dismissed ? "#3D6275" : "#E8F1FF", fontSize: 13, fontWeight: 600, fontFamily: FONT }}>{alert.title}</div>
                      <div style={{ color: "#254560", fontSize: 10, marginTop: 1, fontFamily: MONO }}>
                        {alert.timestamp} · PKTs: {alert.packetIds.join(", ")}
                      </div>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-md"
                      style={{
                        background: alert.dismissed ? "rgba(61,97,117,0.2)" : cfg.bg,
                        color: alert.dismissed ? "#3D6275" : cfg.color,
                        fontSize: 9,
                        fontWeight: 700,
                        border: `1px solid ${alert.dismissed ? "#1C3A56" : cfg.border}`,
                        letterSpacing: "0.08em",
                        fontFamily: FONT,
                      }}
                    >
                      {alert.dismissed ? "DISMISSED" : cfg.label}
                    </span>
                  </div>

                  {/* Alert body */}
                  <div className="px-4 py-3" style={{ background: "#0D1F33" }}>
                    {alert.srcIp && (
                      <div className="mb-2 flex items-center gap-2">
                        <span style={{ color: "#3D6275", fontSize: 10, fontFamily: FONT }}>Source host:</span>
                        <code
                          style={{ color: "#7AB8FF", fontSize: 10, background: "rgba(61,142,255,0.1)", padding: "2px 7px", borderRadius: 4, fontFamily: MONO, border: "1px solid rgba(61,142,255,0.2)" }}
                        >
                          {alert.srcIp}
                        </code>
                      </div>
                    )}
                    <p style={{ color: "#7EA4C2", fontSize: 12, lineHeight: 1.65, marginBottom: 10, fontFamily: FONT }}>{alert.details}</p>

                    <div className="rounded-xl p-3 mb-3" style={{ background: "rgba(6,12,22,0.6)", border: "1px solid #1C3A56" }}>
                      <div style={{ color: "#254560", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 5, fontFamily: FONT }}>RECOMMENDATION</div>
                      <p style={{ color: "#E8F1FF", fontSize: 11, lineHeight: 1.6, fontFamily: FONT }}>{alert.recommendation}</p>
                    </div>

                    {!alert.dismissed && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => onDismiss(alert.id)}
                          className="soc-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                          style={{ background: "rgba(61,97,117,0.12)", color: "#7EA4C2", border: "1px solid #1C3A56", fontSize: 11, cursor: "pointer", fontFamily: FONT }}
                        >
                          <CheckCircle size={12} /> Dismiss
                        </button>
                        <button
                          onClick={() => toast.info(`Viewing ${alert.packetIds.length} packets for: ${alert.title}`)}
                          className="soc-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 11, cursor: "pointer", fontFamily: FONT }}
                        >
                          <Eye size={12} /> View Packets
                        </button>
                        <button
                          onClick={() => toast.warning(`Alert escalated to SOC Tier 2: ${alert.title}`)}
                          className="soc-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                          style={{ background: "rgba(155,110,255,0.1)", color: "#B89AFF", border: "1px solid rgba(155,110,255,0.3)", fontSize: 11, cursor: "pointer", fontFamily: FONT }}
                        >
                          <ArrowUpCircle size={12} /> Escalate
                        </button>
                        <button
                          onClick={() => toast.success(`PCAP segment exported for alert #${alert.id}`)}
                          className="soc-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                          style={{ background: "rgba(13,31,51,0.8)", color: "#3D6275", border: "1px solid #1C3A56", fontSize: 11, cursor: "pointer", fontFamily: FONT }}
                        >
                          <Download size={12} /> Export PCAP
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl" style={{ background: "#0D1F33", border: "1px solid #1C3A56" }}>
            <div
              className="flex items-center justify-center rounded-full mb-4"
              style={{ width: 56, height: 56, background: "rgba(0,232,147,0.1)", border: "2px solid rgba(0,232,147,0.25)" }}
            >
              <CheckCircle size={24} style={{ color: "#00E893" }} />
            </div>
            <p style={{ color: "#E8F1FF", fontSize: 14, fontWeight: 600, fontFamily: FONT, marginBottom: 4 }}>All Clear</p>
            <p style={{ color: "#3D6275", fontSize: 12, fontFamily: FONT }}>No alerts to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
