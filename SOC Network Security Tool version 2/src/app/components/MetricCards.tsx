import { Package, Handshake, Globe, ShieldAlert, TrendingUp, TrendingDown, CheckCircle, AlertCircle, Minus } from "lucide-react";
import type { Packet } from "../data/packetData";

type Props = {
  totalPackets: number;
  tcpSessions: number;
  alertCount: number;
  packets: Packet[];
};

export function MetricCards({ totalPackets, tcpSessions, alertCount, packets }: Props) {
  const dnsPackets = packets.filter((p) => p.protocol === "DNS");
  const dnsCounts  = new Map<string, number>();
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
      title: "Total Packets",
      value: totalPackets.toLocaleString(),
      icon: Package,
      accent: "#3D8EFF",
      accentBg: "rgba(61,142,255,0.12)",
      borderAccent: "rgba(61,142,255,0.25)",
      badge: "LIVE",
      badgeColor: "#00E893",
      badgeBg: "rgba(0,232,147,0.1)",
      badgeBorder: "rgba(0,232,147,0.25)",
      trend: <TrendingUp size={10} style={{ color: "#00E893" }} />,
      trendText: "streaming",
      trendColor: "#00E893",
      isAlert: false,
    },
    {
      title: "TCP Sessions",
      value: String(tcpSessions),
      icon: Handshake,
      accent: "#9B6EFF",
      accentBg: "rgba(155,110,255,0.12)",
      borderAccent: "rgba(155,110,255,0.25)",
      badge: "ESTABLISHED",
      badgeColor: "#00E893",
      badgeBg: "rgba(0,232,147,0.1)",
      badgeBorder: "rgba(0,232,147,0.25)",
      trend: <CheckCircle size={10} style={{ color: "#00E893" }} />,
      trendText: `${successRate}% success rate`,
      trendColor: "#00E893",
      isAlert: false,
    },
    {
      title: "Top DNS Domain",
      value: topDomain.length > 16 ? topDomain.slice(0, 16) + "…" : topDomain,
      icon: Globe,
      accent: "#00CFFF",
      accentBg: "rgba(0,207,255,0.1)",
      borderAccent: "rgba(0,207,255,0.2)",
      badge: `${dnsPackets.length} DNS`,
      badgeColor: "#3D8EFF",
      badgeBg: "rgba(61,142,255,0.1)",
      badgeBorder: "rgba(61,142,255,0.25)",
      trend: <Minus size={10} style={{ color: "#7EA4C2" }} />,
      trendText: `${topDomainCount} queries`,
      trendColor: "#7EA4C2",
      isAlert: false,
    },
    {
      title: "Security Alerts",
      value: String(alertCount),
      icon: ShieldAlert,
      accent: alertCount > 0 ? "#FF3553" : "#00E893",
      accentBg: alertCount > 0 ? "rgba(255,53,83,0.1)" : "rgba(0,232,147,0.08)",
      borderAccent: alertCount > 0 ? "rgba(255,53,83,0.35)" : "rgba(0,232,147,0.2)",
      badge: alertCount > 0 ? `${alertCount} ACTIVE` : "ALL CLEAR",
      badgeColor: alertCount > 0 ? "#FF8098" : "#00E893",
      badgeBg: alertCount > 0 ? "rgba(255,53,83,0.15)" : "rgba(0,232,147,0.1)",
      badgeBorder: alertCount > 0 ? "rgba(255,53,83,0.35)" : "rgba(0,232,147,0.25)",
      trend: alertCount > 0
        ? <AlertCircle size={10} style={{ color: "#FF3553" }} />
        : <CheckCircle size={10} style={{ color: "#00E893" }} />,
      trendText: alertCount > 0 ? "Action required" : "No threats detected",
      trendColor: alertCount > 0 ? "#FF3553" : "#00E893",
      isAlert: alertCount > 0,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 px-4 py-3 flex-shrink-0">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="soc-card rounded-xl p-3 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, #0D1F33 0%, ${card.accentBg} 100%)`,
              border: `1px solid ${card.borderAccent}`,
              ...(card.isAlert ? { animation: "border-glow 2s ease-in-out infinite" } : {}),
            }}
          >
            {/* Top accent line */}
            <div
              className="absolute top-0 left-0 right-0"
              style={{ height: 2, background: `linear-gradient(90deg, transparent, ${card.accent}, transparent)` }}
            />

            <div className="flex items-start justify-between mb-2">
              <div style={{ color: "#7EA4C2", fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", marginTop: 2 }}>
                {card.title.toUpperCase()}
              </div>
              <div
                className="flex items-center justify-center rounded-lg"
                style={{ background: card.accentBg, border: `1px solid ${card.borderAccent}`, width: 32, height: 32, flexShrink: 0 }}
              >
                <Icon size={15} style={{ color: card.accent }} />
              </div>
            </div>

            <div
              style={{
                color: card.isAlert ? "#FF8098" : "#E8F1FF",
                fontSize: 22,
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                marginBottom: 8,
                letterSpacing: "-0.02em",
                textShadow: card.isAlert ? "0 0 20px rgba(255,53,83,0.3)" : `0 0 20px ${card.accent}30`,
              }}
            >
              {card.value}
            </div>

            <div className="flex items-center justify-between">
              <span
                className="px-2 py-0.5 rounded"
                style={{ background: card.badgeBg, border: `1px solid ${card.badgeBorder}`, color: card.badgeColor, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em" }}
              >
                {card.badge}
              </span>
              <div className="flex items-center gap-1">
                {card.trend}
                <span style={{ color: card.trendColor, fontSize: 9 }}>{card.trendText}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
