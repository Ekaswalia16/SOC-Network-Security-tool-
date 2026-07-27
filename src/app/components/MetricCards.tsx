import { Package, Handshake, Globe, ShieldAlert, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import type { Packet } from "../data/packetData";

type Props = {
  totalPackets: number;
  tcpSessions: number;
  alertCount: number;
  packets: Packet[];
};

export function MetricCards({ totalPackets, tcpSessions, alertCount, packets }: Props) {
  const dnsPackets = packets.filter((p) => p.protocol === "DNS");
  const dnsCounts = new Map<string, number>();
  for (const p of dnsPackets) {
    const m = p.info.match(/A ([^\s]+)$/);
    const domain = m?.[1] ?? p.info.slice(0, 20);
    dnsCounts.set(domain, (dnsCounts.get(domain) ?? 0) + 1);
  }
  let topDomain = "api.github.com";
  let topDomainCount = 0;
  for (const [d, c] of dnsCounts.entries()) {
    if (c > topDomainCount) { topDomain = d; topDomainCount = c; }
  }

  const failedHandshakes = packets.filter((p) => p.protocol === "TCP" && p.tcpFlags === "RST").length;
  const successRate = tcpSessions > 0 ? ((tcpSessions / (tcpSessions + failedHandshakes)) * 100).toFixed(1) : "100.0";

  const cards = [
    {
      title: "Total Packets Captured",
      value: totalPackets.toLocaleString(),
      icon: Package,
      iconColor: "#60A5FA",
      iconBg: "rgba(59,130,246,0.15)",
      badge: { label: "Live", color: "#4ADE80", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)" },
      sub: <span style={{ color: "#64748B", fontSize: 11 }}>↑ streaming</span>,
    },
    {
      title: "TCP Sessions",
      value: String(tcpSessions),
      icon: Handshake,
      iconColor: "#A78BFA",
      iconBg: "rgba(139,92,246,0.15)",
      badge: { label: "Established", color: "#4ADE80", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)" },
      sub: <span style={{ color: "#22C55E", fontSize: 11 }}><CheckCircle size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }} />{successRate}% success</span>,
    },
    {
      title: "Top DNS Domain",
      value: topDomain.length > 18 ? topDomain.slice(0, 18) + "…" : topDomain,
      icon: Globe,
      iconColor: "#34D399",
      iconBg: "rgba(52,211,153,0.15)",
      badge: { label: `${dnsPackets.length} DNS`, color: "#60A5FA", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)" },
      sub: null,
    },
    {
      title: "Security Alerts",
      value: String(alertCount),
      icon: ShieldAlert,
      iconColor: alertCount > 0 ? "#F87171" : "#4ADE80",
      iconBg: alertCount > 0 ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
      badge: alertCount > 0
        ? { label: `${alertCount} Active`, color: "#FCA5A5", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)" }
        : { label: "All Clear", color: "#4ADE80", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)" },
      sub: alertCount > 0 ? <span style={{ color: "#F87171", fontSize: 11 }}><AlertCircle size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }} />Action required</span> : null,
      alert: alertCount > 0,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 px-4 py-3 flex-shrink-0">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="rounded-lg p-3"
            style={{ background: "#1E293B", border: card.alert ? "1px solid rgba(239,68,68,0.3)" : "1px solid #334155" }}
          >
            <div className="flex items-start justify-between mb-2">
              <div style={{ color: "#94A3B8", fontSize: 11, fontWeight: 500 }}>{card.title}</div>
              <div className="flex items-center justify-center rounded" style={{ background: card.iconBg, width: 30, height: 30, flexShrink: 0 }}>
                <Icon size={15} color={card.iconColor} />
              </div>
            </div>
            <div style={{ color: card.alert && alertCount > 0 ? "#F87171" : "#F8FAFC", fontSize: 20, fontWeight: 700, fontFamily: "monospace", marginBottom: 6 }}>
              {card.value}
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded" style={{ background: card.badge.bg, border: `1px solid ${card.badge.border}`, color: card.badge.color, fontSize: 10 }}>
                {card.badge.label}
              </span>
            </div>
            {card.sub && <div className="mt-1">{card.sub}</div>}
          </div>
        );
      })}
    </div>
  );
}
