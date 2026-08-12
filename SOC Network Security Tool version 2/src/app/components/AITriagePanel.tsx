import { Bot, Zap, ChevronRight, ShieldAlert, AlertTriangle, Info, Activity, TrendingUp, Lock } from "lucide-react";
import type { Alert } from "../data/packetData";

const FONT = "'Inter', ui-sans-serif, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

const SEV_CONFIG = {
  critical: { color: "#FF8098", bg: "rgba(255,53,83,0.1)",  border: "rgba(255,53,83,0.25)",  icon: ShieldAlert,   leftBar: "#FF3553" },
  warn:     { color: "#FFD077", bg: "rgba(255,173,31,0.1)", border: "rgba(255,173,31,0.25)", icon: AlertTriangle, leftBar: "#FFAD1F" },
  info:     { color: "#7AB8FF", bg: "rgba(61,142,255,0.1)", border: "rgba(61,142,255,0.25)", icon: Info,          leftBar: "#3D8EFF" },
};

type Props = {
  alerts: Alert[];
  onDismiss: (id: number) => void;
  onSwitchToAlerts: () => void;
  totalPackets: number;
};

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 3, background: "#1C3A56" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}60, ${color})`, boxShadow: `0 0 6px ${color}50`, transition: "width 0.5s ease" }}
        />
      </div>
    </div>
  );
}

export function AITriagePanel({ alerts, onDismiss, onSwitchToAlerts, totalPackets }: Props) {
  const active    = alerts.filter((a) => !a.dismissed);
  const critCount = active.filter((a) => a.severity === "critical").length;
  const warnCount = active.filter((a) => a.severity === "warn").length;

  const confidenceScore = 94.7;
  const anomalyRate     = active.length > 0 ? 2.1 : 0.0;
  const encryptedPct    = 68.3;
  const internalPct     = 31.7;

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ background: "#0A1728", borderLeft: "1px solid #1C3A56", fontFamily: FONT }}
    >
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid #1C3A56" }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg,#6D28D9,#4338CA)", width: 30, height: 30, boxShadow: "0 0 16px rgba(109,40,217,0.4)" }}
          >
            <Bot size={15} color="#fff" />
          </div>
          <div>
            <div style={{ color: "#E8F1FF", fontSize: 13, fontWeight: 700, letterSpacing: "0.02em" }}>AI Triage Engine</div>
            <div style={{ color: "#3D6275", fontSize: 9, letterSpacing: "0.06em", fontWeight: 600 }}>AUTOMATED SECURITY ANALYSIS</div>
          </div>
        </div>

        <button
          className="soc-btn w-full flex items-center justify-center gap-2 py-2.5 rounded-xl"
          style={{
            background: "linear-gradient(135deg,rgba(109,40,217,0.25),rgba(67,56,202,0.25))",
            border: "1px solid rgba(109,40,217,0.45)",
            color: "#B89AFF",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(109,40,217,0.15)",
          }}
        >
          <Zap size={13} /> Run Full AI Triage <ChevronRight size={12} style={{ opacity: 0.6 }} />
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-0" style={{ borderBottom: "1px solid #1C3A56" }}>
        {[
          { label: "ANALYZED",  value: totalPackets.toLocaleString(), color: "#3D8EFF" },
          { label: "CRITICAL",  value: String(critCount),              color: critCount > 0 ? "#FF8098" : "#00E893" },
          { label: "WARNINGS",  value: String(warnCount),              color: warnCount > 0 ? "#FFD077" : "#00E893" },
        ].map((s, i) => (
          <div key={s.label} className="py-3 flex flex-col items-center" style={{ borderRight: i < 2 ? "1px solid #1C3A56" : "none" }}>
            <div
              style={{ color: s.color, fontSize: 18, fontWeight: 700, fontFamily: MONO, letterSpacing: "-0.02em",
                textShadow: s.color !== "#3D8EFF" && (critCount > 0 || warnCount > 0) ? `0 0 16px ${s.color}60` : "none"
              }}
            >
              {s.value}
            </div>
            <div style={{ color: "#254560", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Active threats ── */}
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={10} style={{ color: "#3D6275" }} />
          <span style={{ color: "#3D6275", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em" }}>
            ACTIVE THREATS ({active.length})
          </span>
        </div>

        {active.slice(0, 4).map((alert) => {
          const cfg  = SEV_CONFIG[alert.severity];
          const Icon = cfg.icon;
          return (
            <div key={alert.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${cfg.border}` }}>
              <div style={{ display: "flex" }}>
                <div style={{ width: 3, background: cfg.leftBar, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2 px-3 py-2" style={{ background: cfg.bg }}>
                    <Icon size={11} style={{ color: cfg.color, flexShrink: 0 }} />
                    <span style={{ color: "#E8F1FF", fontSize: 11, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {alert.title}
                    </span>
                    <button
                      onClick={() => onDismiss(alert.id)}
                      style={{ color: "#3D6275", background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                  <div className="px-3 py-2" style={{ background: "#0D1F33" }}>
                    <p style={{ color: "#7EA4C2", fontSize: 10, lineHeight: 1.5, marginBottom: 4 }}>
                      {alert.details.slice(0, 75)}…
                    </p>
                    {alert.srcIp && (
                      <code style={{ color: "#7AB8FF", fontSize: 9, background: "rgba(61,142,255,0.1)", padding: "1px 6px", borderRadius: 3, fontFamily: MONO, border: "1px solid rgba(61,142,255,0.2)" }}>
                        {alert.srcIp}
                      </code>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {active.length === 0 && (
          <div className="flex flex-col items-center py-6 rounded-xl" style={{ background: "#0D1F33", border: "1px solid #1C3A56" }}>
            <div className="flex items-center justify-center rounded-full mb-2" style={{ width: 36, height: 36, background: "rgba(0,232,147,0.1)", border: "1px solid rgba(0,232,147,0.25)" }}>
              <span style={{ color: "#00E893", fontSize: 16 }}>✓</span>
            </div>
            <p style={{ color: "#E8F1FF", fontSize: 12, fontWeight: 600, marginBottom: 2 }}>No Active Threats</p>
            <p style={{ color: "#3D6275", fontSize: 10 }}>All clear</p>
          </div>
        )}

        {active.length > 0 && (
          <button
            onClick={onSwitchToAlerts}
            className="soc-btn w-full py-2 rounded-xl text-center"
            style={{ background: "rgba(155,110,255,0.08)", border: "1px solid rgba(155,110,255,0.2)", color: "#B89AFF", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
          >
            View all alerts & manage →
          </button>
        )}
      </div>

      {/* ── Quick Analysis ── */}
      <div className="mx-3 mb-3 p-3 rounded-xl" style={{ background: "#0D1F33", border: "1px solid #1C3A56" }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={10} style={{ color: "#3D6275" }} />
          <span style={{ color: "#3D6275", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em" }}>QUICK ANALYSIS</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {[
            { label: "Confidence Score",  value: `${confidenceScore}%`, color: "#00E893",  pct: confidenceScore },
            { label: "Anomaly Rate",      value: `${anomalyRate}%`,     color: anomalyRate > 0 ? "#FFD077" : "#00E893", pct: anomalyRate * 10 },
            { label: "Encrypted Traffic", value: `${encryptedPct}%`,    color: "#7AB8FF",  pct: encryptedPct },
            { label: "Internal Traffic",  value: `${internalPct}%`,     color: "#7EA4C2",  pct: internalPct },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ color: "#7EA4C2", fontSize: 10 }}>{item.label}</span>
                <span style={{ color: item.color, fontSize: 10, fontWeight: 700, fontFamily: MONO }}>{item.value}</span>
              </div>
              <ScoreBar value={item.pct} color={item.color} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Encryption status ── */}
      <div className="mx-3 mb-3 p-3 rounded-xl" style={{ background: "#0D1F33", border: "1px solid rgba(0,207,255,0.15)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Lock size={10} style={{ color: "#00CFFF" }} />
          <span style={{ color: "#3D6275", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em" }}>ENCRYPTION STATUS</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: "#1C3A56" }}>
            <div
              className="h-full"
              style={{ width: `${encryptedPct}%`, background: "linear-gradient(90deg, #00CFFF, #3D8EFF)", borderRadius: "99px", boxShadow: "0 0 8px rgba(0,207,255,0.4)" }}
            />
          </div>
          <span style={{ color: "#00CFFF", fontSize: 10, fontFamily: MONO, fontWeight: 700 }}>{encryptedPct}%</span>
        </div>
        <div className="flex justify-between mt-1.5">
          <span style={{ color: "#254560", fontSize: 9 }}>TLS/HTTPS encrypted</span>
          <span style={{ color: "#254560", fontSize: 9 }}>{(100 - encryptedPct).toFixed(1)}% plaintext</span>
        </div>
      </div>
    </div>
  );
}
