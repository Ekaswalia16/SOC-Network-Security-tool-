import type { Packet } from "../data/packetData";

type Condition = {
  field: string;
  op: "==" | "!=" | "contains" | ">";
  value: string;
};

function parseCondition(raw: string): Condition | null {
  const s = raw.trim().toLowerCase();
  const m = s.match(/^(ip\.src|ip\.dst|ip|tcp\.port|udp\.port|port|protocol|length|info)\s*(==|!=|contains|>)\s*(.+)$/);
  if (m) return { field: m[1], op: m[2] as Condition["op"], value: m[3].trim() };
  return null;
}

function matchCondition(pkt: Packet, cond: Condition): boolean {
  const { field, op, value } = cond;
  let fieldVal = "";

  switch (field) {
    case "ip.src": fieldVal = pkt.srcIp.toLowerCase(); break;
    case "ip.dst": fieldVal = pkt.dstIp.toLowerCase(); break;
    case "ip": return pkt.srcIp.toLowerCase().includes(value) || pkt.dstIp.toLowerCase().includes(value);
    case "tcp.port":
    case "udp.port":
    case "port": {
      const port = parseInt(value);
      if (op === "==") return pkt.srcPort === port || pkt.dstPort === port;
      if (op === "!=") return pkt.srcPort !== port && pkt.dstPort !== port;
      return false;
    }
    case "protocol": fieldVal = pkt.protocol.toLowerCase(); break;
    case "length": {
      const len = parseInt(value);
      if (op === ">") return pkt.length > len;
      if (op === "==") return pkt.length === len;
      return false;
    }
    case "info": fieldVal = pkt.info.toLowerCase(); break;
    default: fieldVal = "";
  }

  if (op === "==") return fieldVal === value;
  if (op === "!=") return fieldVal !== value;
  if (op === "contains") return fieldVal.includes(value);
  return false;
}

export function filterPackets(packets: Packet[], filter: string): Packet[] {
  if (!filter.trim()) return packets;

  // Split on && (and) handling
  const andParts = filter.split(/&&|\band\b/i).map((s) => s.trim());

  return packets.filter((pkt) => {
    return andParts.every((part) => {
      // Split on || (or)
      const orParts = part.split(/\|\||\bor\b/i).map((s) => s.trim());
      return orParts.some((raw) => {
        const cond = parseCondition(raw);
        if (cond) return matchCondition(pkt, cond);
        // Fallback: text search across all fields
        const search = raw.toLowerCase();
        const haystack = `${pkt.srcIp}:${pkt.srcPort} ${pkt.dstIp}:${pkt.dstPort} ${pkt.protocol} ${pkt.info} ${pkt.length}`.toLowerCase();
        return haystack.includes(search);
      });
    });
  });
}

export function exportToCSV(packets: Packet[]): void {
  const headers = ["ID", "Time", "Source IP", "Source Port", "Dest IP", "Dest Port", "Protocol", "Length", "Info"];
  const rows = packets.map((p) =>
    [p.id, p.time, p.srcIp, p.srcPort, p.dstIp, p.dstPort, p.protocol, p.length, `"${p.info.replace(/"/g, "'")}"`].join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `netinspect-capture-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export const FILTER_EXAMPLES = [
  { label: "DNS only",         filter: "protocol == dns" },
  { label: "HTTP traffic",     filter: "protocol == http" },
  { label: "Host 192.168.1.50",filter: "ip == 192.168.1.50" },
  { label: "Port 443",         filter: "port == 443" },
  { label: "Large packets",    filter: "length > 500" },
  { label: "ICMP",             filter: "protocol == icmp" },
  { label: "TLS traffic",      filter: "protocol == tlsv1.3" },
  { label: "SSH sessions",     filter: "port == 22" },
  { label: "Source 10.0.0.x",  filter: "ip.src contains 10.0.0" },
  { label: "Suspicious host",  filter: "ip == 10.0.0.15" },
];
