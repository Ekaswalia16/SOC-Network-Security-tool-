import { useState } from "react";
import { ChevronRight, ChevronDown, X, Layers, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { Packet } from "../data/packetData";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const FONT = "'Inter', ui-sans-serif, sans-serif";

type TreeNode = { label: string; value?: string; children?: TreeNode[]; defaultOpen?: boolean };

function buildTree(pkt: Packet): TreeNode[] {
  const tree: TreeNode[] = [
    { label: `Frame ${pkt.id}`, value: `${pkt.length} bytes on wire, captured at ${pkt.time}` },
    { label: "Ethernet II", value: "Src: ac:de:48:a1:b2:c3, Dst: ff:ee:dd:cc:bb:aa" },
    {
      label: "Internet Protocol Version 4",
      value: `Src: ${pkt.srcIp}, Dst: ${pkt.dstIp}, TTL: ${pkt.ttl ?? 64}`,
      defaultOpen: true,
      children: [
        { label: "Source Address",      value: pkt.srcIp },
        { label: "Destination Address", value: pkt.dstIp },
        { label: "Time to Live",        value: String(pkt.ttl ?? 64) },
        { label: "Total Length",        value: `${pkt.length} bytes` },
        { label: "Protocol",            value: pkt.protocol === "ICMP" ? "ICMP (1)" : pkt.protocol === "TCP" ? "TCP (6)" : "UDP (17)" },
      ],
    },
  ];

  if (["TCP","TLSv1.3","HTTP","HTTPS","SSH","FTP"].includes(pkt.protocol)) {
    tree.push({
      label: "Transmission Control Protocol",
      value: `Src Port: ${pkt.srcPort}, Dst Port: ${pkt.dstPort}`,
      defaultOpen: true,
      children: [
        { label: "Source Port",      value: String(pkt.srcPort) },
        { label: "Destination Port", value: String(pkt.dstPort) },
        { label: "Sequence Number",  value: String(Math.floor(Math.random() * 9999999)) },
        { label: "Window Size",      value: "64240" },
        { label: "TCP Flags",        value: pkt.tcpFlags ?? "ACK" },
      ],
    });
  }

  if (pkt.protocol === "DNS") {
    tree.push({
      label: "Domain Name System",
      value: pkt.info,
      defaultOpen: true,
      children: [
        { label: "Transaction ID", value: "0x" + Math.floor(Math.random() * 65535).toString(16).padStart(4, "0") },
        { label: "Query Type",     value: pkt.info.includes("response") ? "Response" : "Query" },
        { label: "Questions",      value: "1" },
        { label: "Answers RRs",    value: pkt.info.includes("response") ? "1" : "0" },
        {
          label: "Queries",
          defaultOpen: true,
          children: [
            { label: "Name",  value: pkt.info.match(/A ([^\s]+)$/)?.[1] ?? "unknown" },
            { label: "Type",  value: "A (1)" },
            { label: "Class", value: "IN (0x0001)" },
          ],
        },
      ],
    });
  }

  if (pkt.protocol === "TLSv1.3") {
    tree.push({
      label: "Transport Layer Security (TLSv1.3)",
      value: "",
      defaultOpen: true,
      children: [
        {
          label: "TLSv1.3 Record Layer: Handshake Protocol",
          defaultOpen: true,
          children: [
            { label: "Content Type",           value: "Handshake (22)" },
            { label: "Version",                value: "TLS 1.2 (0x0303)" },
            { label: "Handshake Type",         value: pkt.info.includes("Client Hello") ? "Client Hello (1)" : "Application Data (23)" },
            { label: "Cipher Suite",           value: "TLS_AES_256_GCM_SHA384 (0x1302)" },
            {
              label: "Server Name Indication",
              defaultOpen: true,
              children: [{ label: "Server Name", value: pkt.info.match(/SNI: ([^,)]+)/)?.[1] ?? "unknown" }],
            },
          ],
        },
      ],
    });
  }

  if (pkt.protocol === "HTTP") {
    const isReq = pkt.info.startsWith("GET") || pkt.info.startsWith("POST");
    tree.push({
      label: `Hypertext Transfer Protocol — ${isReq ? "Request" : "Response"}`,
      value: pkt.info,
      defaultOpen: true,
      children: isReq
        ? [
            { label: "Method",  value: pkt.info.split(" ")[0] },
            { label: "URI",     value: pkt.info.split(" ")[1] },
            { label: "Version", value: "HTTP/1.1" },
            { label: "Host",    value: pkt.info.match(/Host: ([^)]+)/)?.[1] ?? pkt.dstIp },
          ]
        : [
            { label: "Status Code",   value: pkt.info.match(/(\d{3})/)?.[1] ?? "200" },
            { label: "Reason",        value: pkt.info.match(/\d{3} (.+?) \(/)?.[1] ?? "OK" },
            { label: "Content-Type",  value: "text/html; charset=utf-8" },
          ],
    });
  }

  return tree;
}

function TreeRow({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(node.defaultOpen ?? false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-start gap-1 rounded"
        style={{ paddingLeft: depth * 14 + 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2, cursor: hasChildren ? "pointer" : "default" }}
        onClick={() => hasChildren && setOpen((o) => !o)}
      >
        <span style={{ width: 14, flexShrink: 0, paddingTop: 1 }}>
          {hasChildren
            ? (open
                ? <ChevronDown size={11} style={{ color: "#3D8EFF" }} />
                : <ChevronRight size={11} style={{ color: "#3D6275" }} />
              )
            : null
          }
        </span>
        <span style={{ fontFamily: MONO, fontSize: 11 }}>
          <span style={{ color: hasChildren ? "#E8F1FF" : "#7EA4C2" }}>{node.label}</span>
          {node.value !== undefined && node.value !== "" && (
            <span style={{ color: "#3D6275" }}>
              {": "}
              <span style={{ color: "#00E893" }}>{node.value}</span>
            </span>
          )}
        </span>
      </div>
      {hasChildren && open && node.children!.map((child, i) => <TreeRow key={i} node={child} depth={depth + 1} />)}
    </div>
  );
}

type Props = { packet: Packet | null; onClose: () => void };

export function PacketInspector({ packet, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!packet) return null;

  const tree = buildTree(packet);

  function copyInfo() {
    const text = `${packet!.time} | ${packet!.srcIp}:${packet!.srcPort} → ${packet!.dstIp}:${packet!.dstPort} | ${packet!.protocol} | ${packet!.info}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    toast.success("Packet info copied");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#0D1F33", border: "1px solid #1C3A56" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: "#08111D", borderBottom: "1px solid #1C3A56" }}
      >
        <div className="flex items-center gap-2">
          <Layers size={13} style={{ color: "#3D8EFF" }} />
          <span style={{ color: "#E8F1FF", fontSize: 12, fontWeight: 600, fontFamily: FONT }}>Packet Detail Inspector</span>
          <span
            className="px-2 py-0.5 rounded-md"
            style={{ background: "rgba(61,142,255,0.12)", color: "#7AB8FF", fontSize: 10, border: "1px solid rgba(61,142,255,0.25)", fontFamily: MONO }}
          >
            #{packet.id} · {packet.protocol} · {packet.length} B
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyInfo}
            className="soc-btn flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ background: "rgba(13,31,51,0.8)", color: copied ? "#00E893" : "#7EA4C2", border: "1px solid #1C3A56", fontSize: 11, cursor: "pointer", fontFamily: FONT }}
          >
            {copied ? <CheckCircle size={11} /> : <Copy size={11} />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg"
            style={{ width: 26, height: 26, color: "#3D6275", background: "transparent", border: "none", cursor: "pointer" }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-0" style={{ borderBottom: "1px solid #1C3A56" }}>
        {[
          { label: "TIMESTAMP",   value: packet.time },
          { label: "SOURCE",      value: `${packet.srcIp}:${packet.srcPort || "—"}` },
          { label: "DESTINATION", value: `${packet.dstIp}:${packet.dstPort || "—"}` },
          { label: "SESSION",     value: packet.sessionId ?? "—" },
        ].map((item, i) => (
          <div
            key={item.label}
            className="px-4 py-2"
            style={{ borderRight: i < 3 ? "1px solid #1C3A56" : "none", background: "rgba(6,12,22,0.4)" }}
          >
            <div style={{ color: "#254560", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", fontFamily: FONT }}>{item.label}</div>
            <div style={{ color: "#E8F1FF", fontSize: 11, fontFamily: MONO, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tree */}
      <div className="p-3" style={{ maxHeight: 220, overflowY: "auto" }}>
        {tree.map((node, i) => <TreeRow key={i} node={node} depth={0} />)}
      </div>
    </div>
  );
}
