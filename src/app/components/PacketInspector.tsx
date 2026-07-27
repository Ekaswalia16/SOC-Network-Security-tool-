import { useState } from "react";
import { ChevronRight, ChevronDown, X, Layers, Copy } from "lucide-react";
import { toast } from "sonner";
import type { Packet } from "../data/packetData";

type TreeNode = { label: string; value?: string; children?: TreeNode[]; defaultOpen?: boolean };

function buildTree(pkt: Packet): TreeNode[] {
  const tree: TreeNode[] = [
    {
      label: `Frame ${pkt.id}`,
      value: `${pkt.length} bytes on wire, captured at ${pkt.time}`,
    },
    {
      label: "Ethernet II",
      value: "Src: ac:de:48:a1:b2:c3, Dst: ff:ee:dd:cc:bb:aa",
    },
    {
      label: `Internet Protocol Version 4`,
      value: `Src: ${pkt.srcIp}, Dst: ${pkt.dstIp}, TTL: ${pkt.ttl ?? 64}`,
      defaultOpen: true,
      children: [
        { label: "Source Address", value: pkt.srcIp },
        { label: "Destination Address", value: pkt.dstIp },
        { label: "Time to Live", value: String(pkt.ttl ?? 64) },
        { label: "Total Length", value: `${pkt.length} bytes` },
        { label: "Protocol", value: pkt.protocol === "ICMP" ? "ICMP (1)" : pkt.protocol === "TCP" ? "TCP (6)" : "UDP (17)" },
      ],
    },
  ];

  if (pkt.protocol === "TCP" || pkt.protocol === "TLSv1.3" || pkt.protocol === "HTTP" || pkt.protocol === "HTTPS" || pkt.protocol === "SSH" || pkt.protocol === "FTP") {
    const tcpChildren: TreeNode[] = [
      { label: "Source Port", value: String(pkt.srcPort) },
      { label: "Destination Port", value: String(pkt.dstPort) },
      { label: "Sequence Number", value: String(Math.floor(Math.random() * 9999999)) },
      { label: "Window Size", value: "64240" },
      { label: "TCP Flags", value: pkt.tcpFlags ?? "ACK" },
    ];
    tree.push({ label: "Transmission Control Protocol", value: `Src Port: ${pkt.srcPort}, Dst Port: ${pkt.dstPort}`, defaultOpen: true, children: tcpChildren });
  }

  if (pkt.protocol === "DNS") {
    tree.push({
      label: "Domain Name System",
      value: pkt.info,
      defaultOpen: true,
      children: [
        { label: "Transaction ID", value: "0x" + Math.floor(Math.random() * 65535).toString(16).padStart(4, "0") },
        { label: "Query Type", value: pkt.info.includes("response") ? "Response" : "Query" },
        { label: "Questions", value: "1" },
        { label: "Answers RRs", value: pkt.info.includes("response") ? "1" : "0" },
        {
          label: "Queries",
          defaultOpen: true,
          children: [
            { label: "Name", value: pkt.info.match(/A ([^\s]+)$/)?.[1] ?? "unknown" },
            { label: "Type", value: "A (1)" },
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
            { label: "Content Type", value: "Handshake (22)" },
            { label: "Version", value: "TLS 1.2 (0x0303)" },
            { label: "Handshake Type", value: pkt.info.includes("Client Hello") ? "Client Hello (1)" : "Application Data (23)" },
            { label: "Cipher Suite", value: "TLS_AES_256_GCM_SHA384 (0x1302)" },
            {
              label: "Server Name Indication",
              defaultOpen: true,
              children: [
                { label: "Server Name", value: pkt.info.match(/SNI: ([^,)]+)/)?.[1] ?? "unknown" },
              ],
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
            { label: "Method", value: pkt.info.split(" ")[0] },
            { label: "URI", value: pkt.info.split(" ")[1] },
            { label: "Version", value: "HTTP/1.1" },
            { label: "Host", value: pkt.info.match(/Host: ([^)]+)/)?.[1] ?? pkt.dstIp },
          ]
        : [
            { label: "Status Code", value: pkt.info.match(/(\d{3})/)?.[1] ?? "200" },
            { label: "Reason", value: pkt.info.match(/\d{3} (.+?) \(/)?.[1] ?? "OK" },
            { label: "Content-Type", value: "text/html; charset=utf-8" },
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
          {hasChildren ? (open ? <ChevronDown size={12} style={{ color: "#60A5FA" }} /> : <ChevronRight size={12} style={{ color: "#60A5FA" }} />) : null}
        </span>
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11 }}>
          <span style={{ color: hasChildren ? "#CBD5E1" : "#94A3B8" }}>{node.label}</span>
          {node.value !== undefined && node.value !== "" && (
            <span style={{ color: "#64748B" }}>
              {": "}
              <span style={{ color: "#4ADE80" }}>{node.value}</span>
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
    toast.success("Packet info copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "#1E293B", border: "1px solid #334155" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ background: "#0F172A", borderBottom: "1px solid #334155" }}>
        <div className="flex items-center gap-2">
          <Layers size={13} color="#60A5FA" />
          <span style={{ color: "#F8FAFC", fontSize: 13, fontWeight: 600 }}>Packet Detail Inspector</span>
          <span className="px-2 py-0.5 rounded" style={{ background: "rgba(59,130,246,0.15)", color: "#60A5FA", fontSize: 11, border: "1px solid rgba(59,130,246,0.3)" }}>
            #{packet.id} · {packet.protocol} · {packet.length} B
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyInfo} className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: "rgba(100,116,139,0.15)", color: copied ? "#4ADE80" : "#94A3B8", border: "1px solid #334155", fontSize: 11, cursor: "pointer" }}>
            <Copy size={11} />{copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={onClose} className="p-1 rounded" style={{ color: "#64748B", background: "transparent", border: "none", cursor: "pointer" }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-0" style={{ borderBottom: "1px solid #334155" }}>
        {[
          { label: "Timestamp", value: packet.time },
          { label: "Source", value: `${packet.srcIp}:${packet.srcPort || "—"}` },
          { label: "Destination", value: `${packet.dstIp}:${packet.dstPort || "—"}` },
          { label: "Session", value: packet.sessionId ?? "—" },
        ].map((item, i) => (
          <div key={item.label} className="px-3 py-2" style={{ borderRight: i < 3 ? "1px solid #334155" : "none", background: "rgba(15,23,42,0.4)" }}>
            <div style={{ color: "#475569", fontSize: 10, fontWeight: 600, letterSpacing: "0.05em" }}>{item.label}</div>
            <div style={{ color: "#CBD5E1", fontSize: 11, fontFamily: "monospace", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Tree */}
      <div className="p-2" style={{ maxHeight: 230, overflowY: "auto" }}>
        {tree.map((node, i) => <TreeRow key={i} node={node} depth={0} />)}
      </div>
    </div>
  );
}
