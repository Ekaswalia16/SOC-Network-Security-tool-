import { useState } from "react";
import { AlertTriangle, ArrowUp, ArrowDown, ChevronsUpDown, Download } from "lucide-react";
import { toast } from "sonner";
import type { Packet } from "../data/packetData";
import { exportToCSV, FILTER_EXAMPLES } from "../utils/filter";

const PROTO_STYLE: Record<string, { bg: string; color: string }> = {
  DNS:       { bg: "rgba(99,102,241,0.2)",  color: "#818CF8" },
  TCP:       { bg: "rgba(59,130,246,0.2)",  color: "#60A5FA" },
  "TLSv1.3": { bg: "rgba(139,92,246,0.2)", color: "#A78BFA" },
  HTTP:      { bg: "rgba(245,158,11,0.2)",  color: "#FCD34D" },
  HTTPS:     { bg: "rgba(52,211,153,0.2)",  color: "#34D399" },
  ICMP:      { bg: "rgba(239,68,68,0.2)",   color: "#F87171" },
  SSH:       { bg: "rgba(74,222,128,0.2)",  color: "#4ADE80" },
  ARP:       { bg: "rgba(251,146,60,0.2)",  color: "#FB923C" },
  FTP:       { bg: "rgba(232,121,249,0.2)", color: "#E879F9" },
  UDP:       { bg: "rgba(103,232,249,0.2)", color: "#67E8F9" },
};

function getProto(p: string) {
  return PROTO_STYLE[p] ?? { bg: "rgba(100,116,139,0.2)", color: "#94A3B8" };
}

type SortField = "id" | "time" | "srcIp" | "dstIp" | "protocol" | "length";

type Props = {
  packets: Packet[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  filter: string;
  onFilterChange: (f: string) => void;
  capturing: boolean;
  totalCount: number;
};

export function PacketTable({ packets, selectedId, onSelect, filter, onFilterChange, capturing, totalCount }: Props) {
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showExamples, setShowExamples] = useState(false);
  const [protoFilter, setProtoFilter] = useState<string | null>(null);

  function toggleSort(f: SortField) {
    if (sortField === f) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(f); setSortDir("asc"); }
  }

  const filtered = protoFilter ? packets.filter((p) => p.protocol === protoFilter) : packets;

  const sorted = [...filtered].sort((a, b) => {
    let av: string | number = a[sortField] ?? "";
    let bv: string | number = b[sortField] ?? "";
    if (sortField === "length") { av = a.length; bv = b.length; }
    const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
    return sortDir === "asc" ? cmp : -cmp;
  });

  const allProtos = Array.from(new Set(packets.map((p) => p.protocol))).sort();
  const flaggedCount = packets.filter((p) => p.flag).length;

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronsUpDown size={10} style={{ color: "#475569" }} />;
    return sortDir === "asc" ? <ArrowUp size={10} style={{ color: "#60A5FA" }} /> : <ArrowDown size={10} style={{ color: "#60A5FA" }} />;
  }

  function handleExport() {
    if (sorted.length === 0) { toast.error("No packets to export"); return; }
    exportToCSV(sorted);
    toast.success(`Exported ${sorted.length} packets to CSV`);
  }

  function handleProtoFilter(p: string) {
    const next = protoFilter === p ? null : p;
    setProtoFilter(next);
    if (next) toast.info(`Filtering by protocol: ${next}`);
    else toast.info("Protocol filter cleared");
  }

  return (
    <div className="flex flex-col rounded-lg" style={{ background: "#1E293B", border: "1px solid #334155", overflow: "visible" }}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-lg" style={{ borderBottom: "1px solid #334155", background: "#0F172A" }}>
        <div className="flex items-center gap-1.5 flex-1 px-2 py-1.5 rounded" style={{ background: "#1E293B", border: "1px solid #334155" }}>
          <span style={{ color: "#475569", fontSize: 11 }}>🔍</span>
          <input
            type="text"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            onFocus={() => setShowExamples(true)}
            onBlur={() => setTimeout(() => setShowExamples(false), 150)}
            placeholder="ip.src == 192.168.1.50  |  port == 443  |  protocol == dns  |  free text…"
            className="flex-1 bg-transparent outline-none"
            style={{ color: "#CBD5E1", fontSize: 12, fontFamily: "ui-monospace,monospace", border: "none" }}
          />
          {filter && (
            <button onClick={() => { onFilterChange(""); toast.info("Filter cleared"); }} style={{ color: "#64748B", background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
          )}
        </div>

        {/* Protocol chip filters */}
        <div className="flex items-center gap-1 flex-wrap">
          {allProtos.slice(0, 7).map((p) => {
            const s = getProto(p);
            const active = protoFilter === p;
            return (
              <button
                key={p}
                onClick={() => handleProtoFilter(p)}
                title={`Filter by ${p}`}
                className="px-2 py-0.5 rounded"
                style={{ background: active ? s.bg : "rgba(30,41,59,0.8)", color: active ? s.color : "#64748B", border: `1px solid ${active ? s.color + "55" : "#334155"}`, fontSize: 10, cursor: "pointer", fontWeight: active ? 700 : 400 }}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleExport}
          title="Download filtered packets as CSV"
          className="flex items-center gap-1 px-2 py-1.5 rounded"
          style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#60A5FA", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          <Download size={11} /> Export CSV
        </button>
      </div>

      {/* ── Quick filter suggestions (inline, no overflow clip issue) ── */}
      {showExamples && !filter && (
        <div style={{ background: "#0F172A", borderBottom: "1px solid #334155", padding: "8px 12px" }}>
          <div style={{ color: "#475569", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 6 }}>QUICK FILTERS — click to apply:</div>
          <div className="flex flex-wrap gap-2">
            {FILTER_EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onMouseDown={() => { onFilterChange(ex.filter); toast.info(`Filter: ${ex.filter}`); }}
                className="flex items-center gap-2 px-2 py-1 rounded"
                style={{ background: "#1E293B", border: "1px solid #334155", cursor: "pointer" }}
              >
                <span style={{ color: "#94A3B8", fontSize: 11 }}>{ex.label}</span>
                <code style={{ color: "#60A5FA", fontSize: 10 }}>{ex.filter}</code>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats bar ── */}
      <div className="flex items-center gap-4 px-3 py-1.5" style={{ background: "rgba(15,23,42,0.5)", borderBottom: "1px solid #334155" }}>
        <div className="flex items-center gap-1.5">
          {capturing && (
            <div className="rounded-full" style={{ width: 6, height: 6, background: "#22C55E", boxShadow: "0 0 5px #22C55E" }} />
          )}
          <span style={{ color: "#64748B", fontSize: 11 }}>
            Showing <span style={{ color: "#F8FAFC", fontWeight: 600 }}>{sorted.length}</span>
            {" "}of <span style={{ color: "#60A5FA", fontWeight: 600 }}>{totalCount.toLocaleString()}</span> packets
          </span>
        </div>
        {protoFilter && (
          <span style={{ color: "#A78BFA", fontSize: 11 }}>
            Protocol: <strong>{protoFilter}</strong>
            <button onClick={() => setProtoFilter(null)} style={{ marginLeft: 4, color: "#64748B", background: "none", border: "none", cursor: "pointer" }}>×</button>
          </span>
        )}
        {filter && (
          <span style={{ color: "#FCD34D", fontSize: 11 }}>
            Filter active — {sorted.length} match{sorted.length !== 1 ? "es" : ""}
          </span>
        )}
        {flaggedCount > 0 && (
          <span className="flex items-center gap-1" style={{ color: "#F87171", fontSize: 11 }}>
            <AlertTriangle size={10} /> {flaggedCount} flagged
          </span>
        )}
        <div className="flex-1" />
        <span style={{ color: "#475569", fontSize: 11 }}>↓ Click any row to inspect layers · ↑↓ Column headers sort</span>
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 300, borderRadius: "0 0 8px 8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 5, background: "#1E293B" }}>
            <tr style={{ borderBottom: "1px solid #334155" }}>
              {(["id", "time", "srcIp", "dstIp", "protocol", "length"] as SortField[]).map((field) => {
                const labels: Record<SortField, string> = { id: "#", time: "Time", srcIp: "Source IP", dstIp: "Dest IP", protocol: "Protocol", length: "Length" };
                return (
                  <th
                    key={field}
                    onClick={() => toggleSort(field)}
                    title={`Sort by ${labels[field]}`}
                    style={{ padding: "6px 10px", textAlign: "left", color: "#64748B", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}
                  >
                    <span className="flex items-center gap-1">{labels[field]} <SortIcon field={field} /></span>
                  </th>
                );
              })}
              <th style={{ padding: "6px 10px", textAlign: "left", color: "#64748B", fontSize: 11, fontWeight: 600 }}>Info / Summary</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((pkt) => {
              const proto = getProto(pkt.protocol);
              const isSelected = selectedId === pkt.id;
              return (
                <tr
                  key={pkt.id}
                  onClick={() => onSelect(pkt.id)}
                  title="Click to inspect packet layers"
                  style={{
                    background: isSelected ? "rgba(59,130,246,0.18)" : pkt.flag === "critical" ? "rgba(239,68,68,0.06)" : pkt.flag === "warn" ? "rgba(245,158,11,0.04)" : "transparent",
                    borderBottom: "1px solid rgba(51,65,85,0.5)",
                    cursor: "pointer",
                    outline: isSelected ? "1px solid rgba(59,130,246,0.4)" : "none",
                  }}
                >
                  <td style={{ padding: "5px 10px", color: "#475569", fontFamily: "monospace" }}>{pkt.id}</td>
                  <td style={{ padding: "5px 10px", color: "#94A3B8", fontFamily: "monospace", whiteSpace: "nowrap" }}>{pkt.time}</td>
                  <td style={{ padding: "5px 10px", color: "#CBD5E1", fontFamily: "monospace", whiteSpace: "nowrap" }}>{pkt.srcIp}:{pkt.srcPort || "—"}</td>
                  <td style={{ padding: "5px 10px", color: "#CBD5E1", fontFamily: "monospace", whiteSpace: "nowrap" }}>{pkt.dstIp}:{pkt.dstPort || "—"}</td>
                  <td style={{ padding: "5px 10px", whiteSpace: "nowrap" }}>
                    <span className="px-1.5 py-0.5 rounded" style={{ background: proto.bg, color: proto.color, fontSize: 10, fontWeight: 700 }}>{pkt.protocol}</span>
                  </td>
                  <td style={{ padding: "5px 10px", color: "#94A3B8", fontFamily: "monospace", whiteSpace: "nowrap" }}>{pkt.length} B</td>
                  <td style={{ padding: "5px 10px", color: pkt.flag === "critical" ? "#F87171" : pkt.flag === "warn" ? "#FCD34D" : "#94A3B8", maxWidth: 340, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {pkt.flag && <AlertTriangle size={10} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />}
                    {pkt.info}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#475569", fontSize: 13 }}>
                  No packets match — <button onClick={() => { onFilterChange(""); setProtoFilter(null); }} style={{ color: "#60A5FA", background: "none", border: "none", cursor: "pointer" }}>clear filter</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
