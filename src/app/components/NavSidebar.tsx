import { Shield, Activity, Network, FileSearch, AlertTriangle, Settings, Database, Eye } from "lucide-react";

type Tab = "capture" | "sessions" | "statistics" | "alerts";

const navItems: { icon: typeof Activity; label: string; tab: Tab; badge?: string }[] = [
  { icon: Activity,     label: "Live Capture",  tab: "capture" },
  { icon: Network,      label: "Sessions",       tab: "sessions" },
  { icon: Database,     label: "Statistics",     tab: "statistics" },
  { icon: AlertTriangle,label: "Alerts",         tab: "alerts" },
];

type Props = { activeTab: Tab; onTabChange: (t: Tab) => void; alertCount: number; capturing: boolean; iface?: string };

export function NavSidebar({ activeTab, onTabChange, alertCount, capturing, iface = "eth0" }: Props) {
  return (
    <div className="flex flex-col h-full" style={{ background: "#0F172A", borderRight: "1px solid #334155", width: 188, minWidth: 188 }}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4" style={{ borderBottom: "1px solid #334155" }}>
        <div className="flex items-center justify-center rounded" style={{ background: "linear-gradient(135deg,#3B82F6,#8B5CF6)", width: 28, height: 28 }}>
          <Shield size={15} color="#fff" />
        </div>
        <div>
          <div style={{ color: "#F8FAFC", fontSize: 13, fontWeight: 700, letterSpacing: "0.02em" }}>NetInspect</div>
          <div style={{ color: "#64748B", fontSize: 10 }}>v1.2 · SOC Edition</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-2 py-3 flex-1">
        <div style={{ color: "#475569", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", padding: "0 8px 6px" }}>ANALYSIS</div>
        {navItems.map(({ icon: Icon, label, tab }) => {
          const active = activeTab === tab;
          const badge = tab === "alerts" ? alertCount : undefined;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className="flex items-center gap-2 px-3 py-2 rounded w-full text-left"
              style={{
                background: active ? "rgba(59,130,246,0.15)" : "transparent",
                color: active ? "#60A5FA" : "#94A3B8",
                border: active ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
                fontSize: 13, cursor: "pointer",
              }}
            >
              <Icon size={14} />
              <span className="flex-1">{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className="flex items-center justify-center rounded-full" style={{ background: "#EF4444", color: "#fff", fontSize: 10, minWidth: 16, height: 16, padding: "0 4px" }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}

        <div style={{ color: "#475569", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", padding: "12px 8px 6px" }}>TOOLS</div>
        <button className="flex items-center gap-2 px-3 py-2 rounded w-full text-left" style={{ background: "transparent", color: "#94A3B8", border: "1px solid transparent", fontSize: 13, cursor: "pointer" }}>
          <Eye size={14} /> <span>Streams</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-2 rounded w-full text-left" style={{ background: "transparent", color: "#94A3B8", border: "1px solid transparent", fontSize: 13, cursor: "pointer" }}>
          <FileSearch size={14} /> <span>PCAP Files</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-2 rounded w-full text-left" style={{ background: "transparent", color: "#94A3B8", border: "1px solid transparent", fontSize: 13, cursor: "pointer" }}>
          <Settings size={14} /> <span>Settings</span>
        </button>
      </nav>

      {/* Status */}
      <div className="px-3 py-3" style={{ borderTop: "1px solid #334155" }}>
        <div className="flex items-center gap-2 px-2 py-2 rounded" style={{ background: capturing ? "rgba(34,197,94,0.1)" : "rgba(100,116,139,0.1)", border: `1px solid ${capturing ? "rgba(34,197,94,0.2)" : "rgba(100,116,139,0.2)"}` }}>
          <div className="rounded-full" style={{ width: 6, height: 6, background: capturing ? "#22C55E" : "#64748B", boxShadow: capturing ? "0 0 6px #22C55E" : "none" }} />
          <span style={{ color: capturing ? "#4ADE80" : "#64748B", fontSize: 11 }}>{capturing ? "Capturing" : "Stopped"}</span>
        </div>
        <div className="mt-2 px-2" style={{ color: "#475569", fontSize: 10 }}>{iface} · 192.168.1.105</div>
      </div>
    </div>
  );
}
