import { useState } from "react";
import { ShieldAlert, AlertTriangle, Info, CheckCircle, X, Eye, Download, ArrowUpCircle, Filter } from "lucide-react";
import { toast } from "sonner";
import type { Alert } from "../data/packetData";

const SEV_CONFIG = {
  critical: { color: "#F87171", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", icon: ShieldAlert, label: "CRITICAL" },
  warn:     { color: "#FCD34D", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)", icon: AlertTriangle, label: "WARNING" },
  info:     { color: "#60A5FA", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)", icon: Info, label: "INFO" },
};

type Props = { alerts: Alert[]; onDismiss: (id: number) => void };

export function AlertsManager({ alerts, onDismiss }: Props) {
  const [sevFilter, setSevFilter] = useState<string | null>(null);
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
      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-3">
        {(["critical", "warn", "info"] as const).map((sev) => {
          const cfg = SEV_CONFIG[sev];
          const Icon = cfg.icon;
          return (
            <button
              key={sev}
              onClick={() => setSevFilter(sevFilter === sev ? null : sev)}
              className="rounded-lg p-3 text-left"
              style={{ background: sevFilter === sev ? cfg.bg : "#1E293B", border: `1px solid ${sevFilter === sev ? cfg.border : "#334155"}`, cursor: "pointer" }}
            >
              <div className="flex items-center gap-2">
                <Icon size={14} color={cfg.color} />
                <span style={{ color: "#94A3B8", fontSize: 11 }}>{cfg.label}</span>
              </div>
              <div style={{ color: cfg.color, fontSize: 24, fontWeight: 700, fontFamily: "monospace", marginTop: 4 }}>{counts[sev]}</div>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <span style={{ color: "#64748B", fontSize: 11, fontWeight: 600 }}>
          {visible.length} alert{visible.length !== 1 ? "s" : ""} shown
        </span>
        <button
          onClick={() => setShowDismissed((v) => !v)}
          className="flex items-center gap-1 px-2 py-1 rounded"
          style={{ background: showDismissed ? "rgba(100,116,139,0.2)" : "transparent", border: "1px solid #334155", color: "#94A3B8", fontSize: 11, cursor: "pointer" }}
        >
          <Filter size={10} /> {showDismissed ? "Hide" : "Show"} dismissed
        </button>
        {sevFilter && (
          <button onClick={() => setSevFilter(null)} className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: "transparent", border: "1px solid #334155", color: "#64748B", fontSize: 11, cursor: "pointer" }}>
            <X size={10} /> Clear filter
          </button>
        )}
      </div>

      {/* Alert cards */}
      <div className="flex flex-col gap-3">
        {visible.map((alert) => {
          const cfg = SEV_CONFIG[alert.severity];
          const Icon = cfg.icon;
          return (
            <div
              key={alert.id}
              className="rounded-lg overflow-hidden"
              style={{ border: `1px solid ${alert.dismissed ? "#334155" : cfg.border}`, opacity: alert.dismissed ? 0.5 : 1 }}
            >
              {/* Alert header */}
              <div className="flex items-center gap-3 px-4 py-2" style={{ background: alert.dismissed ? "#1E293B" : cfg.bg, borderBottom: `1px solid ${alert.dismissed ? "#334155" : cfg.border}` }}>
                <Icon size={14} color={alert.dismissed ? "#64748B" : cfg.color} />
                <div className="flex-1">
                  <div style={{ color: alert.dismissed ? "#64748B" : "#F8FAFC", fontSize: 13, fontWeight: 600 }}>{alert.title}</div>
                  <div style={{ color: "#475569", fontSize: 11, marginTop: 1 }}>{alert.timestamp} · Packets: {alert.packetIds.join(", ")}</div>
                </div>
                <span className="px-2 py-0.5 rounded" style={{ background: alert.dismissed ? "rgba(100,116,139,0.2)" : cfg.bg, color: alert.dismissed ? "#64748B" : cfg.color, fontSize: 10, fontWeight: 700, border: `1px solid ${alert.dismissed ? "#334155" : cfg.border}`, letterSpacing: "0.06em" }}>
                  {alert.dismissed ? "DISMISSED" : cfg.label}
                </span>
              </div>

              {/* Alert body */}
              <div className="px-4 py-3" style={{ background: "#1E293B" }}>
                {alert.srcIp && (
                  <div className="mb-2 flex items-center gap-2">
                    <span style={{ color: "#64748B", fontSize: 11 }}>Source host:</span>
                    <code style={{ color: "#60A5FA", fontSize: 11, background: "rgba(59,130,246,0.1)", padding: "1px 6px", borderRadius: 4 }}>{alert.srcIp}</code>
                  </div>
                )}
                <p style={{ color: "#94A3B8", fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>{alert.details}</p>
                <div className="rounded p-3 mb-3" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid #334155" }}>
                  <div style={{ color: "#64748B", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 4 }}>RECOMMENDATION</div>
                  <p style={{ color: "#CBD5E1", fontSize: 12, lineHeight: 1.5 }}>{alert.recommendation}</p>
                </div>

                {!alert.dismissed && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => { onDismiss(alert.id); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded"
                      style={{ background: "rgba(100,116,139,0.15)", color: "#94A3B8", border: "1px solid #334155", fontSize: 12, cursor: "pointer" }}
                    >
                      <CheckCircle size={12} /> Dismiss
                    </button>
                    <button
                      onClick={() => toast.info(`Viewing ${alert.packetIds.length} packets for: ${alert.title}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 12, cursor: "pointer" }}
                    >
                      <Eye size={12} /> View Packets
                    </button>
                    <button
                      onClick={() => toast.warning(`Alert escalated to SOC Tier 2: ${alert.title}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded"
                      style={{ background: "rgba(139,92,246,0.12)", color: "#A78BFA", border: "1px solid rgba(139,92,246,0.3)", fontSize: 12, cursor: "pointer" }}
                    >
                      <ArrowUpCircle size={12} /> Escalate
                    </button>
                    <button
                      onClick={() => toast.success(`PCAP segment exported for alert #${alert.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded"
                      style={{ background: "rgba(100,116,139,0.12)", color: "#64748B", border: "1px solid #334155", fontSize: 12, cursor: "pointer" }}
                    >
                      <Download size={12} /> Export PCAP Segment
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 rounded-lg" style={{ background: "#1E293B", border: "1px solid #334155" }}>
            <CheckCircle size={32} style={{ color: "#4ADE80", marginBottom: 8 }} />
            <p style={{ color: "#64748B", fontSize: 14 }}>No alerts to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
