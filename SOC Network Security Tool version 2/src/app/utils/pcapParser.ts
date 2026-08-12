import type { Packet, Protocol } from "../data/packetData";

// ── Link-layer types ──────────────────────────────────────────────────────────
const LINKTYPE_ETHERNET   = 1;
const LINKTYPE_RAW        = 101;
const LINKTYPE_LINUX_SLL  = 113;  // Linux "cooked" capture
const LINKTYPE_RAW_IPV4   = 228;

// ── EtherTypes ────────────────────────────────────────────────────────────────
const ETHERTYPE_IPV4 = 0x0800;
const ETHERTYPE_ARP  = 0x0806;
const ETHERTYPE_VLAN = 0x8100;

// ── IP protocols ─────────────────────────────────────────────────────────────
const PROTO_ICMP = 1;
const PROTO_TCP  = 6;
const PROTO_UDP  = 17;

// ── pcap magic numbers (read as little-endian uint32) ────────────────────────
const MAGIC_PCAP_LE    = 0xa1b2c3d4;  // standard, microseconds
const MAGIC_PCAP_NS_LE = 0xa1b23c4d;  // nanoseconds variant
const MAGIC_PCAP_BE    = 0xd4c3b2a1;  // big-endian byte-swapped
const MAGIC_PCAPNG_SHB = 0x0a0d0d0a;  // pcapng Section Header Block

export type PcapParseResult = {
  packets: Packet[];
  count: number;
  skipped: number;
  format: "pcap" | "pcapng" | "unknown";
  error?: string;
};

let _id = 200000;
function nextId() { return ++_id; }

// ── Helpers ───────────────────────────────────────────────────────────────────

function ip4(view: DataView, off: number): string {
  return `${view.getUint8(off)}.${view.getUint8(off+1)}.${view.getUint8(off+2)}.${view.getUint8(off+3)}`;
}

function ts(sec: number, sub: number, ns = false): { time: string; ms: number } {
  const usec = ns ? Math.floor(sub / 1000) : sub;
  const ms = sec * 1000 + Math.floor(usec / 1000);
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const sss = String(Math.floor(usec % 1000000 / 1000)).padStart(3, "0");
  return { time: `${hh}:${mm}:${ss}.${sss}`, ms };
}

function tcpFlagStr(flags: number): string {
  const parts: string[] = [];
  if (flags & 0x02) parts.push("SYN");
  if (flags & 0x10) parts.push("ACK");
  if (flags & 0x01) parts.push("FIN");
  if (flags & 0x04) parts.push("RST");
  if (flags & 0x08) parts.push("PSH");
  return parts.length ? parts.join(",") : "ACK";
}

function inferProto(ipProto: number, sp: number, dp: number): Protocol {
  if (ipProto === PROTO_ICMP) return "ICMP";
  if (sp === 53  || dp === 53)  return "DNS";
  if (sp === 80  || dp === 80)  return "HTTP";
  if (sp === 443 || dp === 443) return "TLSv1.3";
  if (sp === 22  || dp === 22)  return "SSH";
  if (sp === 21  || dp === 21)  return "FTP";
  if (ipProto === PROTO_TCP)    return "TCP";
  return "UDP";
}

// DNS name decoder — handles label compression
function dnsName(view: DataView, off: number, msgOff: number, depth = 0): string {
  if (depth > 10 || off >= view.byteLength) return "?";
  const parts: string[] = [];
  let i = off;
  while (i < view.byteLength) {
    const len = view.getUint8(i);
    if (len === 0) break;
    if ((len & 0xc0) === 0xc0) {
      // compression pointer
      const ptr = ((len & 0x3f) << 8) | view.getUint8(i + 1);
      parts.push(dnsName(view, msgOff + ptr, msgOff, depth + 1));
      break;
    }
    let label = "";
    for (let j = 1; j <= len && i + j < view.byteLength; j++) {
      label += String.fromCharCode(view.getUint8(i + j));
    }
    parts.push(label);
    i += len + 1;
  }
  return parts.join(".");
}

function parseDns(view: DataView, off: number): string {
  try {
    const flags = view.getUint16(off + 2, false);
    const isResp = (flags & 0x8000) !== 0;
    const txId = "0x" + view.getUint16(off, false).toString(16).padStart(4, "0");
    const name = dnsName(view, off + 12, off);
    const typeOff = off + 12 + (() => {
      let i = off + 12;
      while (i < view.byteLength) {
        const l = view.getUint8(i);
        if (l === 0) { i++; break; }
        if ((l & 0xc0) === 0xc0) { i += 2; break; }
        i += l + 1;
      }
      return i - (off + 12);
    })();
    const qtype = view.getUint16(typeOff, false);
    const typeStr = qtype === 1 ? "A" : qtype === 28 ? "AAAA" : qtype === 5 ? "CNAME" : qtype === 15 ? "MX" : `type${qtype}`;
    return isResp
      ? `Standard query response ${txId} ${typeStr} ${name}`
      : `Standard query ${txId} ${typeStr} ${name}`;
  } catch {
    return "DNS packet";
  }
}

function parseTls(view: DataView, off: number): string {
  try {
    if (off + 6 > view.byteLength) return "TLS Application Data";
    const ct = view.getUint8(off); // content type: 22=handshake, 23=app data
    if (ct !== 22) return "TLS Application Data [encrypted]";
    const ht = view.getUint8(off + 5); // handshake type
    if (ht === 1) return "Client Hello (TLSv1.3)";
    if (ht === 2) return "Server Hello (TLSv1.3)";
    if (ht === 11) return "Certificate";
    if (ht === 20) return "Finished";
    return `TLS Handshake (type ${ht})`;
  } catch {
    return "TLS packet";
  }
}

function parseHttp(view: DataView, off: number, len: number): string {
  try {
    let line = "";
    for (let i = 0; i < Math.min(len, 256); i++) {
      const ch = view.getUint8(off + i);
      if (ch === 0x0d || ch === 0x0a) break;
      line += String.fromCharCode(ch);
    }
    if (/^(GET|POST|PUT|DELETE|HEAD|PATCH|OPTIONS) /.test(line)) return line;
    if (line.startsWith("HTTP/")) return line;
    return "HTTP data";
  } catch {
    return "HTTP packet";
  }
}

// ── IPv4 packet processor ─────────────────────────────────────────────────────

function processIPv4(
  view: DataView,
  ipOff: number,
  pktLen: number,
  time: string,
  ms: number
): Packet | null {
  if (ipOff + 20 > view.byteLength) return null;
  const ihl      = (view.getUint8(ipOff) & 0x0f) * 4;
  const totalLen = view.getUint16(ipOff + 2, false);
  const ipProto  = view.getUint8(ipOff + 9);
  const ttl      = view.getUint8(ipOff + 8);
  const srcIp    = ip4(view, ipOff + 12);
  const dstIp    = ip4(view, ipOff + 16);
  const tOff     = ipOff + ihl;

  if (tOff >= view.byteLength) return null;

  let srcPort = 0, dstPort = 0, info = "", tcpFlags: string | undefined;

  if (ipProto === PROTO_ICMP) {
    const t = view.getUint8(tOff);
    const code = view.getUint8(tOff + 1);
    info = t === 8 ? "Echo (ping) request" : t === 0 ? "Echo (ping) reply" : `ICMP type ${t} code ${code}`;
    return { id: nextId(), time, timestampMs: ms, srcIp, srcPort: 0, dstIp, dstPort: 0, protocol: "ICMP", length: pktLen, info, ttl };
  }

  if (ipProto === PROTO_TCP) {
    if (tOff + 14 > view.byteLength) return null;
    srcPort = view.getUint16(tOff, false);
    dstPort = view.getUint16(tOff + 2, false);
    const tcpHL = ((view.getUint8(tOff + 12) >> 4) & 0xf) * 4;
    const rawFlags = view.getUint8(tOff + 13);
    tcpFlags = tcpFlagStr(rawFlags);
    const payOff = tOff + tcpHL;
    const payLen = totalLen - ihl - tcpHL;
    const proto  = inferProto(ipProto, srcPort, dstPort);

    if (proto === "DNS")     info = parseDns(view, payOff + 2); // TCP DNS has 2-byte length prefix
    else if (proto === "TLSv1.3") info = parseTls(view, payOff);
    else if (proto === "HTTP")    info = parseHttp(view, payOff, payLen);
    else if (proto === "SSH")     info = "SSH-2.0 encrypted packet";
    else if (proto === "FTP")     info = parseHttp(view, payOff, payLen);
    else info = `${srcPort} → ${dstPort} [${tcpFlags}] Seq=${view.getUint32(tOff + 4, false)} Len=${Math.max(0, payLen)}`;

    return { id: nextId(), time, timestampMs: ms, srcIp, srcPort, dstIp, dstPort, protocol: proto, length: pktLen, info, ttl, tcpFlags };
  }

  if (ipProto === PROTO_UDP) {
    if (tOff + 8 > view.byteLength) return null;
    srcPort = view.getUint16(tOff, false);
    dstPort = view.getUint16(tOff + 2, false);
    const proto   = inferProto(ipProto, srcPort, dstPort);
    const payOff  = tOff + 8;
    const payLen  = view.getUint16(tOff + 4, false) - 8;

    if (proto === "DNS") info = parseDns(view, payOff);
    else info = `UDP ${srcPort} → ${dstPort} len=${payLen}`;

    return { id: nextId(), time, timestampMs: ms, srcIp, srcPort, dstIp, dstPort, protocol: proto, length: pktLen, info, ttl };
  }

  return null;
}

// ── Ethernet / Linux SLL frame dispatch ──────────────────────────────────────

function processFrame(
  view: DataView,
  frameOff: number,
  frameLen: number,
  linkType: number,
  time: string,
  ms: number
): Packet | null {
  try {
    let ipOff = 0;

    if (linkType === LINKTYPE_ETHERNET) {
      let etherType = view.getUint16(frameOff + 12, false);
      ipOff = frameOff + 14;
      if (etherType === ETHERTYPE_VLAN) {
        etherType = view.getUint16(frameOff + 16, false);
        ipOff = frameOff + 18;
      }
      if (etherType === ETHERTYPE_ARP) {
        return { id: nextId(), time, timestampMs: ms, srcIp: ip4(view, frameOff + 28), srcPort: 0, dstIp: ip4(view, frameOff + 38), dstPort: 0, protocol: "ARP", length: frameLen, info: "ARP request/reply" };
      }
      if (etherType !== ETHERTYPE_IPV4) return null;
    } else if (linkType === LINKTYPE_LINUX_SLL) {
      // Linux cooked: 16-byte SLL header
      const etherType = view.getUint16(frameOff + 14, false);
      ipOff = frameOff + 16;
      if (etherType !== ETHERTYPE_IPV4) return null;
    } else if (linkType === LINKTYPE_RAW || linkType === LINKTYPE_RAW_IPV4) {
      ipOff = frameOff;
    } else {
      return null;
    }

    return processIPv4(view, ipOff, frameLen, time, ms);
  } catch {
    return null;
  }
}

// ── PCAP classic parser ───────────────────────────────────────────────────────

function parsePcapClassic(view: DataView): PcapParseResult {
  const magicLE  = view.getUint32(0, true);
  const le       = magicLE === MAGIC_PCAP_LE || magicLE === MAGIC_PCAP_NS_LE;
  const nsec     = magicLE === MAGIC_PCAP_NS_LE || view.getUint32(0, true) === 0x4d3cb2a1;
  const linkType = view.getUint32(20, le);

  const packets: Packet[] = [];
  let off = 24, skipped = 0;

  while (off + 16 <= view.byteLength) {
    const tsSec  = view.getUint32(off,     le);
    const tsSub  = view.getUint32(off + 4, le);
    const incLen = view.getUint32(off + 8, le);
    const orgLen = view.getUint32(off + 12, le);
    off += 16;

    if (incLen === 0 || incLen > 65536 || off + incLen > view.byteLength) { off += Math.min(incLen, view.byteLength - off); skipped++; continue; }

    const { time, ms } = ts(tsSec, tsSub, nsec);
    const pkt = processFrame(view, off, orgLen, linkType, time, ms);
    if (pkt) packets.push(pkt); else skipped++;
    off += incLen;
  }

  return { packets, count: packets.length, skipped, format: "pcap" };
}

// ── pcapng parser ─────────────────────────────────────────────────────────────

function parsePcapng(view: DataView): PcapParseResult {
  // Read SHB to determine endianness
  const bom = view.getUint32(8, true); // byte-order magic at offset 8
  const le = bom === 0x1a2b3c4d;

  const packets: Packet[] = [];
  let off = 0, skipped = 0;
  let linkType = LINKTYPE_ETHERNET; // default, updated by IDB
  let ifTsResolution = 6; // default: microseconds (10^-6)

  while (off + 12 <= view.byteLength) {
    const blockType = view.getUint32(off, le);
    const blockLen  = view.getUint32(off + 4, le);

    if (blockLen < 12 || blockLen > view.byteLength - off) break;

    // Interface Description Block
    if (blockType === 0x00000001 && off + 20 <= view.byteLength) {
      linkType = view.getUint16(off + 8, le);
      // options might contain if_tsresol
    }

    // Enhanced Packet Block
    if (blockType === 0x00000006 && off + 28 <= view.byteLength) {
      const tsHigh  = view.getUint32(off + 12, le);
      const tsLow   = view.getUint32(off + 16, le);
      const capLen  = view.getUint32(off + 20, le);
      const orgLen  = view.getUint32(off + 24, le);
      const dataOff = off + 28;

      // Combine 64-bit timestamp (microseconds by default)
      const tsMicros = tsHigh * 4294967296 + tsLow; // 2^32
      const tsSec  = Math.floor(tsMicros / 1000000);
      const tsUsec = tsMicros % 1000000;

      if (capLen <= 65536 && dataOff + capLen <= view.byteLength) {
        const { time, ms } = ts(tsSec, tsUsec, false);
        const pkt = processFrame(view, dataOff, orgLen, linkType, time, ms);
        if (pkt) packets.push(pkt); else skipped++;
      } else {
        skipped++;
      }
    }

    // Obsolete Packet Block (type 2)
    if (blockType === 0x00000002 && off + 28 <= view.byteLength) {
      const capLen  = view.getUint16(off + 12, le);
      const orgLen  = view.getUint16(off + 14, le);
      const dataOff = off + 16;
      const tsSec   = 0; // OPB has no reliable timestamp, just use 0
      const { time, ms } = ts(tsSec, 0, false);
      if (capLen <= 65536 && dataOff + capLen <= view.byteLength) {
        const pkt = processFrame(view, dataOff, orgLen, linkType, time, ms);
        if (pkt) packets.push(pkt); else skipped++;
      }
    }

    off += blockLen;
  }

  return { packets, count: packets.length, skipped, format: "pcapng" };
}

// ── Public entry point ────────────────────────────────────────────────────────

export function parsePcapFile(buffer: ArrayBuffer): PcapParseResult {
  try {
    if (buffer.byteLength < 24) return { packets: [], count: 0, skipped: 0, format: "unknown", error: "File too small to be a valid PCAP" };

    const view = new DataView(buffer);
    const magic = view.getUint32(0, true); // little-endian read

    if (magic === MAGIC_PCAP_LE || magic === MAGIC_PCAP_NS_LE || magic === MAGIC_PCAP_BE) {
      return parsePcapClassic(view);
    }

    if (magic === MAGIC_PCAPNG_SHB) {
      return parsePcapng(view);
    }

    return { packets: [], count: 0, skipped: 0, format: "unknown", error: "Not a valid PCAP or PCAPNG file. Magic bytes did not match." };
  } catch (e) {
    return { packets: [], count: 0, skipped: 0, format: "unknown", error: String(e) };
  }
}
