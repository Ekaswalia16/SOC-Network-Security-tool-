export type Protocol = "TCP" | "UDP" | "DNS" | "HTTP" | "HTTPS" | "TLSv1.3" | "ICMP" | "ARP" | "FTP" | "SSH";

export type Packet = {
  id: number;
  time: string;
  timestampMs: number;
  srcIp: string;
  srcPort: number;
  dstIp: string;
  dstPort: number;
  protocol: Protocol;
  length: number;
  info: string;
  flag?: "warn" | "critical";
  ttl?: number;
  tcpFlags?: string;
  sessionId?: string;
};

export type Alert = {
  id: number;
  severity: "info" | "warn" | "critical";
  title: string;
  details: string;
  recommendation: string;
  srcIp?: string;
  packetIds: number[];
  timestamp: string;
  dismissed: boolean;
};

const startMs = Date.now() - 60000;
let _id = 1;
let _ms = 0;

function ms(delta = 0): number {
  _ms += delta;
  return startMs + _ms;
}
function ts(delta = 0): string {
  const t = new Date(ms(delta));
  const h = String(t.getHours()).padStart(2, "0");
  const m = String(t.getMinutes()).padStart(2, "0");
  const s = String(t.getSeconds()).padStart(2, "0");
  const ms2 = String(t.getMilliseconds()).padStart(3, "0");
  return `${h}:${m}:${s}.${ms2}`;
}

export const initialPackets: Packet[] = [
  { id: _id++, time: ts(100),  timestampMs: ms(), srcIp: "192.168.1.50", srcPort: 54322, dstIp: "1.1.1.1",        dstPort: 53,   protocol: "DNS",    length: 74,  info: "Standard query 0xa1b2 A api.github.com", sessionId: "dns-1" },
  { id: _id++, time: ts(123),  timestampMs: ms(), srcIp: "1.1.1.1",       srcPort: 53,   dstIp: "192.168.1.50",  dstPort: 54322, protocol: "DNS",    length: 90,  info: "Standard query response 0xa1b2 A 140.82.121.4", sessionId: "dns-1" },
  { id: _id++, time: ts(50),   timestampMs: ms(), srcIp: "192.168.1.50", srcPort: 49812, dstIp: "140.82.121.4",  dstPort: 443,  protocol: "TCP",    length: 74,  info: "49812 → 443 [SYN] Seq=0 Win=64240 Len=0", tcpFlags: "SYN", sessionId: "tcp-1" },
  { id: _id++, time: ts(15),   timestampMs: ms(), srcIp: "140.82.121.4",  srcPort: 443,  dstIp: "192.168.1.50",  dstPort: 49812, protocol: "TCP",    length: 74,  info: "443 → 49812 [SYN, ACK] Seq=0 Ack=1 Win=65535", tcpFlags: "SYN,ACK", sessionId: "tcp-1" },
  { id: _id++, time: ts(1),    timestampMs: ms(), srcIp: "192.168.1.50", srcPort: 49812, dstIp: "140.82.121.4",  dstPort: 443,  protocol: "TCP",    length: 66,  info: "49812 → 443 [ACK] Seq=1 Ack=1 [Handshake Complete - RTT 16.2ms]", tcpFlags: "ACK", sessionId: "tcp-1" },
  { id: _id++, time: ts(14),   timestampMs: ms(), srcIp: "192.168.1.50", srcPort: 49812, dstIp: "140.82.121.4",  dstPort: 443,  protocol: "TLSv1.3", length: 512, info: "Client Hello (SNI: api.github.com, Cipher: TLS_AES_256_GCM_SHA384)", sessionId: "tcp-1" },
  { id: _id++, time: ts(200),  timestampMs: ms(), srcIp: "140.82.121.4",  srcPort: 443,  dstIp: "192.168.1.50",  dstPort: 49812, protocol: "TLSv1.3", length: 1480, info: "Server Hello, Certificate, Server Hello Done", sessionId: "tcp-1" },
  { id: _id++, time: ts(800),  timestampMs: ms(), srcIp: "192.168.1.50", srcPort: 50114, dstIp: "192.168.1.1",   dstPort: 80,   protocol: "HTTP",   length: 418, info: "GET /admin/login.php HTTP/1.1 (Host: 192.168.1.1)", flag: "warn", sessionId: "http-1" },
  { id: _id++, time: ts(45),   timestampMs: ms(), srcIp: "192.168.1.1",   srcPort: 80,   dstIp: "192.168.1.50",  dstPort: 50114, protocol: "HTTP",   length: 230, info: "HTTP/1.1 401 Unauthorized (text/html)", flag: "warn", sessionId: "http-1" },
  { id: _id++, time: ts(1365), timestampMs: ms(), srcIp: "10.0.0.15",    srcPort: 0,    dstIp: "192.168.1.255", dstPort: 0,    protocol: "ICMP",   length: 98,  info: "Echo (ping) request id=0x0001 seq=1/256 (Ping Sweep Detected)", flag: "critical", sessionId: "icmp-sweep" },
  { id: _id++, time: ts(5),    timestampMs: ms(), srcIp: "10.0.0.15",    srcPort: 0,    dstIp: "192.168.1.1",   dstPort: 0,    protocol: "ICMP",   length: 98,  info: "Echo (ping) request id=0x0001 seq=2/256", flag: "critical", sessionId: "icmp-sweep" },
  { id: _id++, time: ts(5),    timestampMs: ms(), srcIp: "10.0.0.15",    srcPort: 0,    dstIp: "192.168.1.2",   dstPort: 0,    protocol: "ICMP",   length: 98,  info: "Echo (ping) request id=0x0001 seq=3/256", flag: "critical", sessionId: "icmp-sweep" },
  { id: _id++, time: ts(300),  timestampMs: ms(), srcIp: "192.168.1.51", srcPort: 58001, dstIp: "8.8.8.8",       dstPort: 53,   protocol: "DNS",    length: 68,  info: "Standard query 0xb2c3 A www.google.com", sessionId: "dns-2" },
  { id: _id++, time: ts(88),   timestampMs: ms(), srcIp: "8.8.8.8",       srcPort: 53,   dstIp: "192.168.1.51",  dstPort: 58001, protocol: "DNS",    length: 84,  info: "Standard query response 0xb2c3 A 142.250.80.46", sessionId: "dns-2" },
  { id: _id++, time: ts(50),   timestampMs: ms(), srcIp: "192.168.1.51", srcPort: 44300, dstIp: "142.250.80.46", dstPort: 443,  protocol: "TCP",    length: 74,  info: "44300 → 443 [SYN] Seq=0 Win=65535 Len=0", tcpFlags: "SYN", sessionId: "tcp-2" },
  { id: _id++, time: ts(12),   timestampMs: ms(), srcIp: "142.250.80.46", srcPort: 443,  dstIp: "192.168.1.51",  dstPort: 44300, protocol: "TCP",    length: 74,  info: "443 → 44300 [SYN, ACK] Seq=0 Ack=1", tcpFlags: "SYN,ACK", sessionId: "tcp-2" },
  { id: _id++, time: ts(1),    timestampMs: ms(), srcIp: "192.168.1.51", srcPort: 44300, dstIp: "142.250.80.46", dstPort: 443,  protocol: "TLSv1.3", length: 498, info: "Client Hello (SNI: www.google.com)", sessionId: "tcp-2" },
  { id: _id++, time: ts(500),  timestampMs: ms(), srcIp: "192.168.1.100", srcPort: 22,   dstIp: "192.168.1.50",  dstPort: 22,   protocol: "SSH",    length: 196, info: "Encrypted packet (SSH-2.0-OpenSSH_9.0)", sessionId: "ssh-1" },
  { id: _id++, time: ts(40),   timestampMs: ms(), srcIp: "192.168.1.50", srcPort: 22,   dstIp: "192.168.1.100", dstPort: 22,   protocol: "SSH",    length: 164, info: "Encrypted packet (SSH-2.0-OpenSSH_8.9)", sessionId: "ssh-1" },
  { id: _id++, time: ts(200),  timestampMs: ms(), srcIp: "192.168.1.50", srcPort: 63000, dstIp: "151.101.1.140", dstPort: 443,  protocol: "TCP",    length: 74,  info: "63000 → 443 [SYN] Seq=0 Win=64240 Len=0", tcpFlags: "SYN", sessionId: "tcp-3" },
  { id: _id++, time: ts(18),   timestampMs: ms(), srcIp: "151.101.1.140", srcPort: 443,  dstIp: "192.168.1.50",  dstPort: 63000, protocol: "TCP",    length: 74,  info: "443 → 63000 [SYN, ACK] Seq=0 Ack=1", tcpFlags: "SYN,ACK", sessionId: "tcp-3" },
  { id: _id++, time: ts(1),    timestampMs: ms(), srcIp: "192.168.1.50", srcPort: 63000, dstIp: "151.101.1.140", dstPort: 443,  protocol: "TLSv1.3", length: 524, info: "Client Hello (SNI: cdn.jsdelivr.net)", sessionId: "tcp-3" },
  { id: _id++, time: ts(600),  timestampMs: ms(), srcIp: "192.168.1.51", srcPort: 55555, dstIp: "1.1.1.1",       dstPort: 53,   protocol: "DNS",    length: 78,  info: "Standard query 0xcc01 A login.microsoft.com (DGA-like burst)", flag: "warn", sessionId: "dns-dga" },
  { id: _id++, time: ts(20),   timestampMs: ms(), srcIp: "192.168.1.51", srcPort: 55556, dstIp: "1.1.1.1",       dstPort: 53,   protocol: "DNS",    length: 78,  info: "Standard query 0xcc02 A api.example.xyz (suspicious .xyz)", flag: "warn", sessionId: "dns-dga" },
  { id: _id++, time: ts(20),   timestampMs: ms(), srcIp: "192.168.1.51", srcPort: 55557, dstIp: "1.1.1.1",       dstPort: 53,   protocol: "DNS",    length: 78,  info: "Standard query 0xcc03 A cdn.random123.xyz (suspicious .xyz)", flag: "warn", sessionId: "dns-dga" },
  { id: _id++, time: ts(800),  timestampMs: ms(), srcIp: "192.168.1.50", srcPort: 21,    dstIp: "192.168.1.100", dstPort: 21,   protocol: "FTP",    length: 120, info: "Request: USER anonymous", flag: "warn", sessionId: "ftp-1" },
  { id: _id++, time: ts(100),  timestampMs: ms(), srcIp: "192.168.1.100", srcPort: 21,   dstIp: "192.168.1.50",  dstPort: 21,   protocol: "FTP",    length: 96,  info: "Response: 230 Login successful", sessionId: "ftp-1" },
  { id: _id++, time: ts(400),  timestampMs: ms(), srcIp: "192.168.1.50", srcPort: 54000, dstIp: "104.21.45.78",  dstPort: 443,  protocol: "TLSv1.3", length: 1480, info: "Application Data [encrypted stream 12.4 KB]", sessionId: "tcp-4" },
  { id: _id++, time: ts(200),  timestampMs: ms(), srcIp: "104.21.45.78",  srcPort: 443,  dstIp: "192.168.1.50",  dstPort: 54000, protocol: "TLSv1.3", length: 1480, info: "Application Data [encrypted stream 48.2 KB]", sessionId: "tcp-4" },
  { id: _id++, time: ts(2000), timestampMs: ms(), srcIp: "192.168.1.105", srcPort: 0,    dstIp: "192.168.1.50",  dstPort: 0,    protocol: "ARP",    length: 42,  info: "Who has 192.168.1.50? Tell 192.168.1.105", sessionId: "arp-1" },
];

// Packet generator for live capture
const GEN_HOSTS = ["192.168.1.50", "192.168.1.51", "192.168.1.100", "192.168.1.105"];
const GEN_EXTERNAL = ["140.82.121.4", "142.250.80.46", "151.101.1.140", "104.21.45.78", "172.217.14.206", "1.1.1.1", "8.8.8.8"];
const GEN_DOMAINS = ["api.github.com", "www.google.com", "cdn.cloudflare.com", "fonts.googleapis.com", "api.stripe.com", "login.microsoftonline.com"];
const GEN_PATHS = ["/api/v1/repos", "/search?q=react", "/static/bundle.js", "/favicon.ico", "/api/auth/token"];

let genId = _id;
let genMs = _ms;

export function generatePacket(): Packet {
  const now = Date.now();
  const roll = Math.random();
  const src = GEN_HOSTS[Math.floor(Math.random() * GEN_HOSTS.length)];
  const ext = GEN_EXTERNAL[Math.floor(Math.random() * GEN_EXTERNAL.length)];
  const domain = GEN_DOMAINS[Math.floor(Math.random() * GEN_DOMAINS.length)];
  const t = new Date(now);
  const timeStr = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}:${String(t.getSeconds()).padStart(2, "0")}.${String(t.getMilliseconds()).padStart(3, "0")}`;
  const id = genId++;

  if (roll < 0.18) {
    // DNS
    const isResponse = Math.random() > 0.5;
    return {
      id, time: timeStr, timestampMs: now,
      srcIp: isResponse ? "1.1.1.1" : src,
      srcPort: isResponse ? 53 : 50000 + Math.floor(Math.random() * 10000),
      dstIp: isResponse ? src : "1.1.1.1",
      dstPort: isResponse ? 50000 + Math.floor(Math.random() * 10000) : 53,
      protocol: "DNS", length: isResponse ? 86 + Math.floor(Math.random() * 40) : 68,
      info: isResponse ? `Standard query response A ${ext}` : `Standard query A ${domain}`,
      sessionId: `dns-live-${id}`,
    };
  } else if (roll < 0.45) {
    // TLS/HTTPS
    const direction = Math.random() > 0.5;
    return {
      id, time: timeStr, timestampMs: now,
      srcIp: direction ? src : ext,
      srcPort: direction ? 40000 + Math.floor(Math.random() * 20000) : 443,
      dstIp: direction ? ext : src,
      dstPort: direction ? 443 : 40000 + Math.floor(Math.random() * 20000),
      protocol: "TLSv1.3", length: 400 + Math.floor(Math.random() * 1080),
      info: direction ? `Application Data [encrypted, ${(Math.random() * 10 + 1).toFixed(1)} KB]` : `Application Data [server response]`,
      sessionId: `tls-live-${Math.floor(id / 3)}`,
    };
  } else if (roll < 0.62) {
    // TCP
    const flags = ["SYN", "SYN,ACK", "ACK", "FIN,ACK", "RST"][Math.floor(Math.random() * 5)];
    const sport = 40000 + Math.floor(Math.random() * 20000);
    return {
      id, time: timeStr, timestampMs: now,
      srcIp: src, srcPort: sport, dstIp: ext, dstPort: 443,
      protocol: "TCP", length: 66 + Math.floor(Math.random() * 20),
      info: `${sport} → 443 [${flags}] Seq=${Math.floor(Math.random() * 999999)} Win=64240`,
      tcpFlags: flags, sessionId: `tcp-live-${Math.floor(id / 4)}`,
    };
  } else if (roll < 0.72) {
    // HTTP
    const path = GEN_PATHS[Math.floor(Math.random() * GEN_PATHS.length)];
    const isReq = Math.random() > 0.45;
    return {
      id, time: timeStr, timestampMs: now,
      srcIp: isReq ? src : "192.168.1.1",
      srcPort: isReq ? 50000 + Math.floor(Math.random() * 10000) : 80,
      dstIp: isReq ? "192.168.1.1" : src,
      dstPort: isReq ? 80 : 50000 + Math.floor(Math.random() * 10000),
      protocol: "HTTP", length: isReq ? 300 + Math.floor(Math.random() * 500) : 200 + Math.floor(Math.random() * 300),
      info: isReq ? `GET ${path} HTTP/1.1` : "HTTP/1.1 200 OK",
      sessionId: `http-live-${Math.floor(id / 3)}`,
    };
  } else if (roll < 0.79) {
    // SSH
    return {
      id, time: timeStr, timestampMs: now,
      srcIp: src, srcPort: Math.random() > 0.5 ? 22 : 50000 + Math.floor(Math.random() * 10000),
      dstIp: "192.168.1.100",
      dstPort: Math.random() > 0.5 ? 50000 + Math.floor(Math.random() * 10000) : 22,
      protocol: "SSH", length: 100 + Math.floor(Math.random() * 200),
      info: "Encrypted packet (SSH-2.0-OpenSSH)",
      sessionId: "ssh-1",
    };
  } else {
    // ICMP / ARP
    return {
      id, time: timeStr, timestampMs: now,
      srcIp: src, srcPort: 0, dstIp: ext, dstPort: 0,
      protocol: "ICMP", length: 98,
      info: `Echo (ping) request seq=${Math.floor(Math.random() * 255)}`,
    };
  }
}

// --- Sessions ---
export type Session = {
  id: string;
  srcIp: string;
  dstIp: string;
  srcPort: number;
  dstPort: number;
  protocol: Protocol;
  packetCount: number;
  bytes: number;
  state: "ESTABLISHED" | "CLOSED" | "SYN_SENT" | "TIME_WAIT" | "LISTENING";
  startTime: string;
  duration: string;
};

export function computeSessions(packets: Packet[]): Session[] {
  const map = new Map<string, Session>();
  for (const pkt of packets) {
    const key = pkt.sessionId ?? `${pkt.srcIp}-${pkt.dstIp}-${pkt.dstPort}-${pkt.protocol}`;
    if (!map.has(key)) {
      let state: Session["state"] = "ESTABLISHED";
      if (pkt.tcpFlags === "SYN") state = "SYN_SENT";
      else if (pkt.tcpFlags === "FIN,ACK") state = "TIME_WAIT";
      map.set(key, {
        id: key, srcIp: pkt.srcIp, dstIp: pkt.dstIp, srcPort: pkt.srcPort, dstPort: pkt.dstPort,
        protocol: pkt.protocol, packetCount: 0, bytes: 0, state, startTime: pkt.time,
        duration: "0s",
      });
    }
    const s = map.get(key)!;
    s.packetCount++;
    s.bytes += pkt.length;
    if (pkt.tcpFlags === "FIN,ACK" || pkt.tcpFlags === "RST") s.state = "CLOSED";
  }
  return Array.from(map.values());
}

// --- Statistics ---
export type Stats = {
  protocolCounts: { name: string; value: number; color: string }[];
  topSources: { ip: string; packets: number; bytes: number }[];
  topDests: { ip: string; packets: number; bytes: number }[];
  timeline: { time: string; packets: number; bytes: number }[];
  totalBytes: number;
  avgPacketSize: number;
};

const PROTOCOL_COLORS: Record<string, string> = {
  DNS: "#818CF8", TCP: "#60A5FA", TLSv1_3: "#A78BFA", "TLSv1.3": "#A78BFA",
  HTTP: "#FCD34D", HTTPS: "#34D399", ICMP: "#F87171", SSH: "#4ADE80",
  ARP: "#FB923C", FTP: "#E879F9", UDP: "#67E8F9",
};

export function computeStats(packets: Packet[]): Stats {
  const protocolMap = new Map<string, number>();
  const srcMap = new Map<string, { packets: number; bytes: number }>();
  const dstMap = new Map<string, { packets: number; bytes: number }>();
  const timelineMap = new Map<string, { packets: number; bytes: number }>();
  let totalBytes = 0;

  for (const pkt of packets) {
    protocolMap.set(pkt.protocol, (protocolMap.get(pkt.protocol) ?? 0) + 1);

    const src = srcMap.get(pkt.srcIp) ?? { packets: 0, bytes: 0 };
    src.packets++; src.bytes += pkt.length;
    srcMap.set(pkt.srcIp, src);

    const dst = dstMap.get(pkt.dstIp) ?? { packets: 0, bytes: 0 };
    dst.packets++; dst.bytes += pkt.length;
    dstMap.set(pkt.dstIp, dst);

    const bucket = pkt.time.slice(0, 8); // hh:mm:ss
    const tl = timelineMap.get(bucket) ?? { packets: 0, bytes: 0 };
    tl.packets++; tl.bytes += pkt.length;
    timelineMap.set(bucket, tl);

    totalBytes += pkt.length;
  }

  return {
    protocolCounts: Array.from(protocolMap.entries())
      .map(([name, value]) => ({ name, value, color: PROTOCOL_COLORS[name] ?? "#94A3B8" }))
      .sort((a, b) => b.value - a.value),
    topSources: Array.from(srcMap.entries())
      .map(([ip, v]) => ({ ip, ...v }))
      .sort((a, b) => b.packets - a.packets)
      .slice(0, 8),
    topDests: Array.from(dstMap.entries())
      .map(([ip, v]) => ({ ip, ...v }))
      .sort((a, b) => b.packets - a.packets)
      .slice(0, 8),
    timeline: Array.from(timelineMap.entries())
      .map(([time, v]) => ({ time, ...v }))
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(-20),
    totalBytes,
    avgPacketSize: packets.length > 0 ? Math.round(totalBytes / packets.length) : 0,
  };
}

export const initialAlerts: Alert[] = [
  {
    id: 1, severity: "warn", title: "High DNS Request Burst",
    details: "192.168.1.51 generated 120 DNS queries within 2 seconds targeting .xyz domains.",
    recommendation: "Check host for potential automated beaconing or malware domain generation algorithms (DGA).",
    srcIp: "192.168.1.51", packetIds: [23, 24, 25], timestamp: "00:01:22.500", dismissed: false,
  },
  {
    id: 2, severity: "critical", title: "Sequential ICMP Ping Sweep Detected",
    details: "10.0.0.15 sending rapid ICMP Echo Requests across subnet 192.168.1.0/24.",
    recommendation: "Subnet discovery/reconnaissance activity. Isolate host immediately.",
    srcIp: "10.0.0.15", packetIds: [10, 11, 12], timestamp: "00:00:03.410", dismissed: false,
  },
  {
    id: 3, severity: "warn", title: "Unencrypted HTTP Admin Access Attempt",
    details: "192.168.1.50 attempted GET /admin/login.php over plaintext HTTP on port 80.",
    recommendation: "Admin interfaces should only be accessible over HTTPS. Check for credential exposure.",
    srcIp: "192.168.1.50", packetIds: [8, 9], timestamp: "00:00:02.001", dismissed: false,
  },
  {
    id: 4, severity: "info", title: "Anonymous FTP Login Detected",
    details: "192.168.1.50 authenticated to FTP server at 192.168.1.100 using anonymous credentials.",
    recommendation: "Disable anonymous FTP access. Verify no sensitive files are accessible.",
    srcIp: "192.168.1.50", packetIds: [26, 27], timestamp: "00:01:08.000", dismissed: false,
  },
];
