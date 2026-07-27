import { Bot, Zap, ChevronRight, ShieldAlert, AlertTriangle, Info, RefreshCw } from "lucide-react";
import type { Alert } from "../data/packetData";

const SEV_CONFIG = {
  critical: { color: "#F87171", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.25)", icon: ShieldAlert },
  warn:     { color: "#FCD34D", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", icon: AlertTriangle },
  info:     { color: "#60A5FA", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)", icon: Info },
};

type Props = {
  alerts: Alert[];
  onDismiss: (id: number) => void;
  onSwitchToAlerts: () => void;
  totalPackets: number;
};

export function AITriagePanel({ alerts, onDismiss, onSwitchToAlerts, totalPackets }: Props) {
  const active = alerts.filter((a) => !a.dismissed);
  const critCount = active.filter((a) => a.severity === "critical").length;
  const warnCount = active.filter((a) => a.severity === "warn").length;

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: "#0F172A", borderLeft: "1px solid #334155" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid #334155" }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center rounded" style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)", width: 26, height: 26 }}>
            <Bot size={14} color="#fff" />
          </div>
          <div>
            <div style={{ color: "#F8FAFC", fontSize: 13, fontWeight: 700 }}>AI Assistive Triage</div>
            <div style={{ color: "#64748B", fontSize: 10 }}>Automated Security Analysis</div>
          </div>
        </div>

        <button
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded"
          style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(79,70,229,0.3))", border: "1px solid rgba(124,58,237,0.5)", color: "#A78BFA", fontSize: 12, cursor: "pointer" }}
        >
          <Zap size={12} /> Run Full AI Triage <ChevronRight size={12} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-0" style={{ borderBottom: "1px solid #334155" }}>
        {[
          { label: "Analyzed", value: totalPackets.toLocaleString(), color: "#60A5FA" },
          { label: "Critical", value: String(critCount), color: critCount > 0 ? "#F87171" : "#4ADE80" },
          { label: "Warnings", value: String(warnCount), color: warnCount > 0 ? "#FCD34D" : "#4ADE80" },
        ].map((s, i) => (
          <div key={s.label} className="py-3 flex flex-col items-center" style={{ borderRight: i < 2 ? "1px solid #334155" : "none" }}>
            <div style={{ color: s.color, fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>{s.value}</div>
            <div style={{ color: "#64748B", fontSize: 10 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alert cards */}
      <div className="flex flex-col gap-2 p-3">
        <div style={{ color: "#64748B", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 2 }}>
          ACTIVE THREATS ({active.length})
        </div>

        {active.slice(0, 4).map((alert) => {
          const cfg = SEV_CONFIG[alert.severity];
          const Icon = cfg.icon;
          return (
            <div key={alert.id} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${cfg.border}` }}>
              <div className="flex items-center gap-2 px-3 py-2" style={{ background: cfg.bg }}>
                <Icon size={12} color={cfg.color} />
                <span style={{ color: "#F8FAFC", fontSize: 12, fontWeight: 600, flex: 1 }}>{alert.title}</span>
                <button onClick={() => onDismiss(alert.id)} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
              </div>
              <div className="px-3 py-2" style={{ background: "#1E293B" }}>
                <p style={{ color: "#94A3B8", fontSize: 11, lineHeight: 1.5, marginBottom: 6 }}>{alert.details.slice(0, 80)}...</p>
                {alert.srcIp && (
                  <code style={{ color: "#60A5FA", fontSize: 10, background: "rgba(59,130,246,0.1)", padding: "1px 5px", borderRadius: 3 }}>{alert.srcIp}</code>
                )}
              </div>
            </div>
          );
        })}

        {active.length === 0 && (
          <div className="flex flex-col items-center py-6 rounded-lg" style={{ background: "#1E293B", border: "1px solid #334155" }}>
            <div style={{ color: "#4ADE80", fontSize: 20, marginBottom: 4 }}>✓</div>
            <p style={{ color: "#64748B", fontSize: 12 }}>No active threats</p>
          </div>
        )}

        {active.length > 0 && (
          <button
            onClick={onSwitchToAlerts}
            className="w-full py-2 rounded text-center"
            style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", color: "#A78BFA", fontSize: 12, cursor: "pointer" }}
          >
            View all alerts & manage →
          </button>
        )}
      </div>

      {/* Quick analysis */}
      <div className="mx-3 mb-3 p-3 rounded-lg" style={{ background: "#1E293B", border: "1px solid #334155" }}>
        <div style={{ color: "#64748B", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 8 }}>QUICK ANALYSIS</div>
        <div className="flex flex-col gap-2">
          {[
            { label: "Confidence Score", value: "94.7%", color: "#4ADE80" },
            { label: "Anomaly Rate", value: `${active.length > 0 ? "2.1" : "0.0"}%`, color: active.length > 0 ? "#FCD34D" : "#4ADE80" },
            { label: "Encrypted Traffic", value: "68.3%", color: "#60A5FA" },
            { label: "Internal Traffic", value: "31.7%", color: "#94A3B8" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span style={{ color: "#94A3B8", fontSize: 11 }}>{item.label}</span>
              <span style={{ color: item.color, fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
