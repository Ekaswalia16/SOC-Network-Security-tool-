import { useState } from "react";
import { AlertTriangle, ArrowUp, ArrowDown, ChevronsUpDown, Download, Search, X } from "lucide-react";
import { toast } from "sonner";
import type { Packet } from "../data/packetData";
import { exportToCSV, FILTER_EXAMPLES } from "../utils/filter";

const PROTO_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  DNS:       { bg: "rgba(129,140,248,0.15)", color: "#A5B4FC", border: "rgba(129,140,248,0.3)" },
  TCP:       { bg: "rgba(61,142,255,0.15)",  color: "#7AB8FF", border: "rgba(61,142,255,0.3)" },
  "TLSv1.3": { bg: "rgba(155,110,255,0.15)", color: "#B89AFF", border: "rgba(155,110,255,0.3)" },
  HTTP:      { bg: "rgba(255,173,31,0.15)",  color: "#FFD077", border: "rgba(255,173,31,0.3)" },
  HTTPS:     { bg: "rgba(0,232,147,0.12)",   color: "#00E893", border: "rgba(0,232,147,0.25)" },
  ICMP:      { bg: "rgba(255,53,83,0.15)",   color: "#FF8098", border: "rgba(255,53,83,0.3)" },
  SSH:       { bg: "rgba(0,207,255,0.12)",   color: "#00CFFF", border: "rgba(0,207,255,0.25)" },
  ARP:       { bg: "rgba(251,146,60,0.15)",  color: "#FDB07D", border: "rgba(251,146,60,0.3)" },
  FTP:       { bg: "rgba(232,121,249,0.15)", color: "#ECA3FA", border: "rgba(232,121,249,0.3)" },
  UDP:       { bg: "rgba(103,232,249,0.15)", color: "#67E8F9", border: "rgba(103,232,249,0.3)" },
};

function getProto(p: string) {
  return PROTO_STYLE[p] ?? { bg: "rgba(61,97,117,0.2)", color: "#7EA4C2", border: "rgba(61,97,117,0.3)" };
}

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const FONT = "'Inter', ui-sans-serif, sans-serif";

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
  const [sortField, setSortField]     = useState<SortField>("id");
  const [sortDir, setSortDir]         = useState<"asc" | "desc">("asc");
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

  const allProtos   = Array.from(new Set(packets.map((p) => p.protocol))).sort();
  const flaggedCount = packets.filter((p) => p.flag).length;

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronsUpDown size={9} style={{ color: "#254560" }} />;
    return sortDir === "asc"
      ? <ArrowUp size={9} style={{ color: "#3D8EFF" }} />
      : <ArrowDown size={9} style={{ color: "#3D8EFF" }} />;
  }

  function handleExport() {
    if (sorted.length === 0) { toast.error("No packets to export"); return; }
    exportToCSV(sorted);
    toast.success(`Exported ${sorted.length} packets to CSV`);
  }

  function handleProtoFilter(p: string) {
    const next = protoFilter === p ? null : p;
    setProtoFilter(next);
    if (next) toast.info(`Filter: ${next}`);
    else toast.info("Protocol filter cleared");
  }

  return (
    <div className="flex flex-col rounded-xl" style={{ background: "#0D1F33", border: "1px solid #1C3A56", overflow: "visible" }}>

      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-xl"
        style={{ borderBottom: "1px solid #1C3A56", background: "#08111D" }}
      >
        <div
          className="flex items-center gap-2 flex-1 px-3 py-1.5 rounded-lg"
          style={{ background: "#0D1F33", border: "1px solid #1C3A56" }}
        >
          <Search size={12} style={{ color: "#3D6275", flexShrink: 0 }} />
          <input
            type="text"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            onFocus={() => setShowExamples(true)}
            onBlur={() => setTimeout(() => setShowExamples(false), 150)}
            placeholder="ip.src == 192.168.1.50  |  port == 443  |  protocol == dns  |  free text…"
            className="flex-1 bg-transparent outline-none"
            style={{ color: "#E8F1FF", fontSize: 11, fontFamily: MONO, border: "none" }}
          />
          {filter && (
            <button
              onClick={() => { onFilterChange(""); toast.info("Filter cleared"); }}
              style={{ color: "#3D6275", background: "none", border: "none", cursor: "pointer", lineHeight: 1, padding: 0 }}
            >
              <X size={12} />
            </button>
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
                className="px-2 py-0.5 rounded-md"
                style={{
                  background: active ? s.bg : "rgba(13,31,51,0.9)",
                  color: active ? s.color : "#3D6275",
                  border: `1px solid ${active ? s.border : "#1C3A56"}`,
                  fontSize: 9,
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: FONT,
                  letterSpacing: "0.04em",
                  transition: "all 0.15s ease",
                }}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleExport}
          className="soc-btn flex items-center gap-1 px-2.5 py-1.5 rounded-lg"
          style={{ background: "rgba(61,142,255,0.08)", border: "1px solid rgba(61,142,255,0.2)", color: "#7AB8FF", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap", fontFamily: FONT }}
        >
          <Download size={11} /> CSV
        </button>
      </div>

      {/* ── Quick filter suggestions ── */}
      {showExamples && !filter && (
        <div style={{ background: "#08111D", borderBottom: "1px solid #1C3A56", padding: "8px 14px" }}>
          <div style={{ color: "#254560", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 6 }}>QUICK FILTERS — click to apply:</div>
          <div className="flex flex-wrap gap-2">
            {FILTER_EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onMouseDown={() => { onFilterChange(ex.filter); toast.info(`Filter: ${ex.filter}`); }}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg"
                style={{ background: "#0D1F33", border: "1px solid #1C3A56", cursor: "pointer", fontFamily: FONT }}
              >
                <span style={{ color: "#7EA4C2", fontSize: 11 }}>{ex.label}</span>
                <code style={{ color: "#3D8EFF", fontSize: 10, fontFamily: MONO }}>{ex.filter}</code>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats bar ── */}
      <div
        className="flex items-center gap-4 px-4 py-1.5"
        style={{ background: "rgba(6,12,22,0.6)", borderBottom: "1px solid rgba(28,58,86,0.5)" }}
      >
        <div className="flex items-center gap-2">
          {capturing && (
            <div
              className="rounded-full live-dot"
              style={{ width: 5, height: 5, background: "#00E893", boxShadow: "0 0 6px #00E893" }}
            />
          )}
          <span style={{ color: "#3D6275", fontSize: 11, fontFamily: FONT }}>
            Showing{" "}
            <span style={{ color: "#E8F1FF", fontWeight: 600 }}>{sorted.length}</span>
            {" "}of{" "}
            <span style={{ color: "#3D8EFF", fontWeight: 600 }}>{totalCount.toLocaleString()}</span>
            {" "}packets
          </span>
        </div>
        {protoFilter && (
          <span style={{ color: "#B89AFF", fontSize: 11 }}>
            Proto: <strong style={{ fontFamily: MONO }}>{protoFilter}</strong>
            <button onClick={() => setProtoFilter(null)} style={{ marginLeft: 4, color: "#3D6275", background: "none", border: "none", cursor: "pointer", padding: 0 }}>×</button>
          </span>
        )}
        {filter && (
          <span style={{ color: "#FFD077", fontSize: 11 }}>
            Filter: {sorted.length} match{sorted.length !== 1 ? "es" : ""}
          </span>
        )}
        {flaggedCount > 0 && (
          <span className="flex items-center gap-1" style={{ color: "#FF8098", fontSize: 11 }}>
            <AlertTriangle size={10} /> {flaggedCount} flagged
          </span>
        )}
        <div className="flex-1" />
        <span style={{ color: "#254560", fontSize: 10 }}>Click row to inspect · Column headers sort</span>
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 300, borderRadius: "0 0 12px 12px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 5, background: "#0A1728" }}>
            <tr style={{ borderBottom: "1px solid #1C3A56" }}>
              {(["id", "time", "srcIp", "dstIp", "protocol", "length"] as SortField[]).map((field) => {
                const labels: Record<SortField, string> = { id: "#", time: "Time", srcIp: "Source IP", dstIp: "Dest IP", protocol: "Protocol", length: "Length" };
                return (
                  <th
                    key={field}
                    onClick={() => toggleSort(field)}
                    style={{
                      padding: "7px 10px",
                      textAlign: "left",
                      color: sortField === field ? "#7AB8FF" : "#3D6275",
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      userSelect: "none",
                      letterSpacing: "0.05em",
                      fontFamily: FONT,
                    }}
                  >
                    <span className="flex items-center gap-1">{labels[field]} <SortIcon field={field} /></span>
                  </th>
                );
              })}
              <th style={{ padding: "7px 10px", textAlign: "left", color: "#3D6275", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", fontFamily: FONT }}>
                Info
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((pkt) => {
              const proto      = getProto(pkt.protocol);
              const isSelected = selectedId === pkt.id;
              const isCritical = pkt.flag === "critical";
              const isWarn     = pkt.flag === "warn";
              return (
                <tr
                  key={pkt.id}
                  onClick={() => onSelect(pkt.id)}
                  className="soc-row"
                  style={{
                    background: isSelected
                      ? "rgba(61,142,255,0.15)"
                      : isCritical
                        ? "rgba(255,53,83,0.05)"
                        : isWarn
                          ? "rgba(255,173,31,0.04)"
                          : "transparent",
                    borderBottom: "1px solid rgba(28,58,86,0.4)",
                    cursor: "pointer",
                    outline: isSelected ? "1px solid rgba(61,142,255,0.35)" : "none",
                  }}
                >
                  <td style={{ padding: "5px 10px", color: "#254560", fontFamily: MONO }}>{pkt.id}</td>
                  <td style={{ padding: "5px 10px", color: "#7EA4C2", fontFamily: MONO, whiteSpace: "nowrap" }}>{pkt.time}</td>
                  <td style={{ padding: "5px 10px", color: "#E8F1FF", fontFamily: MONO, whiteSpace: "nowrap" }}>
                    {pkt.srcIp}
                    <span style={{ color: "#3D6275" }}>:{pkt.srcPort || "—"}</span>
                  </td>
                  <td style={{ padding: "5px 10px", color: "#E8F1FF", fontFamily: MONO, whiteSpace: "nowrap" }}>
                    {pkt.dstIp}
                    <span style={{ color: "#3D6275" }}>:{pkt.dstPort || "—"}</span>
                  </td>
                  <td style={{ padding: "5px 10px", whiteSpace: "nowrap" }}>
                    <span
                      className="rounded-md"
                      style={{ background: proto.bg, color: proto.color, border: `1px solid ${proto.border}`, fontSize: 9, fontWeight: 700, padding: "1px 6px", letterSpacing: "0.04em" }}
                    >
                      {pkt.protocol}
                    </span>
                  </td>
                  <td style={{ padding: "5px 10px", color: "#7EA4C2", fontFamily: MONO, whiteSpace: "nowrap" }}>
                    {pkt.length} <span style={{ color: "#254560" }}>B</span>
                  </td>
                  <td
                    style={{
                      padding: "5px 10px",
                      color: isCritical ? "#FF8098" : isWarn ? "#FFD077" : "#7EA4C2",
                      maxWidth: 340,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontFamily: MONO,
                    }}
                  >
                    {pkt.flag && <AlertTriangle size={9} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />}
                    {pkt.info}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#254560", fontSize: 12, fontFamily: FONT }}>
                  No packets match —{" "}
                  <button
                    onClick={() => { onFilterChange(""); setProtoFilter(null); }}
                    style={{ color: "#3D8EFF", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                  >
                    clear filter
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
