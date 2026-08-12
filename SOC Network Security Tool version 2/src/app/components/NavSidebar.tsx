import { Shield, Activity, Network, Database, AlertTriangle, Settings, Eye, FileSearch, Wifi, WifiOff } from "lucide-react";

type Tab = "capture" | "sessions" | "statistics" | "alerts";

const NAV_ITEMS: { icon: typeof Activity; label: string; tab: Tab; desc: string }[] = [
  { icon: Activity,      label: "Live Capture",  tab: "capture",    desc: "Packet stream" },
  { icon: Network,       label: "Sessions",      tab: "sessions",   desc: "TCP/UDP flows" },
  { icon: Database,      label: "Statistics",    tab: "statistics", desc: "Traffic analysis" },
  { icon: AlertTriangle, label: "Alerts",        tab: "alerts",     desc: "Security events" },
];

type Props = {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  alertCount: number;
  capturing: boolean;
  iface?: string;
  onOpenPcap?: () => void;
  onOpenSettings?: () => void;
};

function ThreatBar({ alertCount }: { alertCount: number }) {
  const level = alertCount === 0 ? "LOW" : alertCount <= 2 ? "MEDIUM" : "HIGH";
  const pct   = alertCount === 0 ? 20 : alertCount <= 2 ? 55 : 88;
  const color = alertCount === 0 ? "#00E893" : alertCount <= 2 ? "#FFAD1F" : "#FF3553";
  const bg    = alertCount === 0 ? "rgba(0,232,147,0.15)" : alertCount <= 2 ? "rgba(255,173,31,0.15)" : "rgba(255,53,83,0.15)";
  return (
    <div className="mx-3 mb-3 rounded-lg p-3" style={{ background: "#0A1728", border: "1px solid #1C3A56" }}>
      <div className="flex items-center justify-between mb-2">
        <span style={{ color: "#3D6275", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em" }}>THREAT LEVEL</span>
        <span
          className="px-2 py-0.5 rounded"
          style={{ background: bg, color, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
            ...(level === "HIGH" ? { animation: "threat-pulse 2s ease-in-out infinite" } : {})
          }}
        >
          {level}
        </span>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: 4, background: "#1C3A56" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 8px ${color}60`, transition: "width 0.6s ease" }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span style={{ color: "#3D6275", fontSize: 9 }}>LOW</span>
        <span style={{ color: "#3D6275", fontSize: 9 }}>HIGH</span>
      </div>
    </div>
  );
}

export function NavSidebar({ activeTab, onTabChange, alertCount, capturing, iface = "eth0", onOpenPcap, onOpenSettings }: Props) {
  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "#0A1728", borderRight: "1px solid #1C3A56", width: 200, minWidth: 200, fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid #1C3A56" }}>
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ background: "linear-gradient(135deg,#1A5EB8,#7C3AED)", width: 32, height: 32, flexShrink: 0, boxShadow: "0 0 16px rgba(61,142,255,0.4)" }}
        >
          <Shield size={16} color="#fff" />
        </div>
        <div>
          <div style={{ color: "#E8F1FF", fontSize: 13, fontWeight: 700, letterSpacing: "0.03em" }}>NetInspect</div>
          <div style={{ color: "#3D6275", fontSize: 9, letterSpacing: "0.06em", fontWeight: 600 }}>SOC EDITION v1.2</div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex flex-col gap-1 px-2 pt-4 flex-1">
        <div style={{ color: "#3D6275", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", padding: "0 10px 8px" }}>ANALYSIS</div>

        {NAV_ITEMS.map(({ icon: Icon, label, tab, desc }) => {
          const active = activeTab === tab;
          const badge  = tab === "alerts" ? alertCount : 0;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left relative"
              style={{
                background:   active ? "rgba(61,142,255,0.12)" : "transparent",
                color:        active ? "#7AB8FF" : "#7EA4C2",
                border:       active ? "1px solid rgba(61,142,255,0.25)" : "1px solid transparent",
                borderLeft:   active ? "2px solid #3D8EFF" : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              <Icon size={14} style={{ flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 12, fontWeight: active ? 600 : 400 }}>{label}</div>
                <div style={{ color: active ? "rgba(122,184,255,0.6)" : "#3D6275", fontSize: 9, marginTop: 0 }}>{desc}</div>
              </div>
              {badge > 0 && (
                <span
                  className="flex items-center justify-center rounded-full"
                  style={{ background: "#FF3553", color: "#fff", fontSize: 9, fontWeight: 700, minWidth: 17, height: 17, padding: "0 4px",
                    boxShadow: "0 0 8px rgba(255,53,83,0.5)", animation: "threat-pulse 2s ease-in-out infinite"
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}

        <div style={{ color: "#3D6275", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", padding: "16px 10px 8px" }}>TOOLS</div>

        {[
          { icon: Eye,        label: "Streams",    onClick: () => onTabChange("capture") },
          { icon: FileSearch, label: "PCAP Files", onClick: onOpenPcap },
          { icon: Settings,   label: "Settings",   onClick: onOpenSettings },
        ].map(({ icon: Icon, label, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="nav-item flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left"
            style={{ background: "transparent", color: "#7EA4C2", border: "1px solid transparent", cursor: "pointer", fontSize: 12 }}
          >
            <Icon size={13} style={{ flexShrink: 0 }} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* ── Threat Level ── */}
      <ThreatBar alertCount={alertCount} />

      {/* ── Analyst Profile ── */}
      <div className="mx-3 mb-3 rounded-lg p-3" style={{ background: "#060C16", border: "1px solid #1C3A56" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0 text-white font-bold"
            style={{ width: 34, height: 34, background: "linear-gradient(135deg,#1A5EB8,#7C3AED)", fontSize: 13, boxShadow: "0 0 10px rgba(61,142,255,0.35)" }}
          >
            EW
          </div>
          <div className="min-w-0 flex-1">
            <div style={{ color: "#E8F1FF", fontSize: 11, fontWeight: 700, letterSpacing: "0.02em" }}>Ekas Walia</div>
            <div style={{ color: "#3D8EFF", fontSize: 9, fontWeight: 600, letterSpacing: "0.06em" }}>UNIVERSITY STUDENT</div>
          </div>
          <div className="rounded-full flex-shrink-0" style={{ width: 7, height: 7, background: "#00E893", boxShadow: "0 0 6px #00E893" }} />
        </div>
        <div className="mt-2 pt-2" style={{ borderTop: "1px solid #1C3A56" }}>
          <div style={{ color: "#3D6275", fontSize: 9, marginBottom: 2 }}>
            <span style={{ color: "#7EA4C2" }}>✉</span> ekaswalia4@gmail.com
          </div>
          <div style={{ color: "#3D6275", fontSize: 9 }}>
            <span style={{ color: "#7EA4C2" }}>☎</span> +91 93114 11803
          </div>
        </div>
      </div>

      {/* ── Interface Status ── */}
      <div className="px-3 pb-3" style={{ borderTop: "1px solid #1C3A56", paddingTop: 12 }}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: capturing ? "rgba(0,232,147,0.07)" : "rgba(61,97,117,0.1)", border: `1px solid ${capturing ? "rgba(0,232,147,0.2)" : "rgba(61,97,117,0.2)"}` }}
        >
          {capturing ? (
            <Wifi size={12} style={{ color: "#00E893", flexShrink: 0 }} />
          ) : (
            <WifiOff size={12} style={{ color: "#3D6275", flexShrink: 0 }} />
          )}
          <div className="min-w-0">
            <div style={{ color: capturing ? "#00E893" : "#3D6275", fontSize: 10, fontWeight: 600 }}>
              {capturing ? "CAPTURING" : "STOPPED"}
            </div>
            <div style={{ color: "#254560", fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {iface} · 192.168.1.105
            </div>
          </div>
          {capturing && (
            <div
              className="rounded-full live-dot ml-auto"
              style={{ width: 6, height: 6, background: "#00E893", boxShadow: "0 0 8px #00E893", flexShrink: 0 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
