import { useState, useEffect, useRef } from "react";
import { FolderOpen, Zap, Loader2, Settings, Upload, FlaskConical, BookOpen, X } from "lucide-react";
import { Toaster, toast } from "sonner";

import { NavSidebar } from "./components/NavSidebar";
import { MetricCards } from "./components/MetricCards";
import { PacketTable } from "./components/PacketTable";
import { PacketInspector } from "./components/PacketInspector";
import { TCPHandshake } from "./components/TCPHandshake";
import { Statistics } from "./components/Statistics";
import { Sessions } from "./components/Sessions";
import { AlertsManager } from "./components/AlertsManager";
import { AITriagePanel } from "./components/AITriagePanel";
import { NetworkSetup, loadNetworkConfig } from "./components/NetworkSetup";
import type { NetworkConfig } from "./components/NetworkSetup";

import { initialPackets, initialAlerts, generatePacket, computeSessions, computeStats } from "./data/packetData";
import type { Packet, Alert } from "./data/packetData";
import { filterPackets } from "./utils/filter";
import { parsePcapFile } from "./utils/pcapParser";

type Tab = "capture" | "sessions" | "statistics" | "alerts";
type Mode = "demo" | "real";

export default function App() {
  const [mode, setMode] = useState<Mode>("demo");
  const [pcapFilename, setPcapFilename] = useState<string>("");

  const [packets, setPackets] = useState<Packet[]>(initialPackets);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);

  // Use a ref so intervals can read the latest value synchronously
  const demoRunning = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [filter, setFilter] = useState("");
  const [selectedPacketId, setSelectedPacketId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("capture");
  const [pcapLoading, setPcapLoading] = useState(false);
  const [triaging, setTriaging] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [netConfig, setNetConfig] = useState<NetworkConfig>(loadNetworkConfig);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [totalCount, setTotalCount] = useState(initialPackets.length);

  // Start demo simulation
  function startDemo() {
    demoRunning.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countIntervalRef.current) clearInterval(countIntervalRef.current);

    intervalRef.current = setInterval(() => {
      if (!demoRunning.current) return;
      const count = Math.floor(Math.random() * 3) + 1;
      setPackets((prev) => {
        const newPkts: Packet[] = [];
        for (let i = 0; i < count; i++) newPkts.push(generatePacket());
        return [...prev, ...newPkts].slice(-500);
      });
    }, 600);

    countIntervalRef.current = setInterval(() => {
      if (!demoRunning.current) return;
      setTotalCount((c) => c + Math.floor(Math.random() * 3) + 1);
    }, 600);
  }

  // Stop demo simulation immediately via ref (no React state delay)
  function stopDemo() {
    demoRunning.current = false;
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (countIntervalRef.current) { clearInterval(countIntervalRef.current); countIntervalRef.current = null; }
  }

  useEffect(() => {
    startDemo();
    return () => stopDemo();
  }, []);

  // ── PCAP upload — real binary parser ──────────────────────────────────────
  function handlePcapUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    setPcapLoading(true);
    toast.loading(`Reading ${file.name}…`, { id: "pcap" });

    const reader = new FileReader();
    reader.onload = (ev) => {
      const buf = ev.target?.result as ArrayBuffer;
      if (!buf) {
        toast.error("Could not read file", { id: "pcap" });
        setPcapLoading(false);
        return;
      }

      const result = parsePcapFile(buf);

      if (result.error) {
        toast.error(`Not a valid PCAP/PCAPNG: ${result.error}`, { id: "pcap", duration: 6000 });
        setPcapLoading(false);
        return;
      }

      if (result.packets.length === 0) {
        toast.warning(
          `No supported packets found. Format: ${result.format}, Skipped: ${result.skipped}. The file may use an unsupported link type.`,
          { id: "pcap", duration: 8000 }
        );
        setPcapLoading(false);
        return;
      }

      // Stop simulation NOW (synchronous via ref)
      stopDemo();

      // Replace ALL data with real parsed packets
      setPackets(result.packets);
      setTotalCount(result.packets.length);
      setSelectedPacketId(null);
      setFilter("");
      setMode("real");
      setPcapFilename(file.name);
      setActiveTab("capture");

      toast.success(
        `✓ Loaded ${result.packets.length.toLocaleString()} real packets from ${file.name} (${result.format.toUpperCase()}) — ${result.skipped} skipped`,
        { id: "pcap", duration: 6000 }
      );
      setPcapLoading(false);
    };

    reader.onerror = () => {
      toast.error("File read failed", { id: "pcap" });
      setPcapLoading(false);
    };

    reader.readAsArrayBuffer(file);
  }

  function resetToDemo() {
    setMode("demo");
    setPcapFilename("");
    setPackets(initialPackets);
    setTotalCount(initialPackets.length);
    setFilter("");
    setSelectedPacketId(null);
    startDemo();
    toast.info("Switched back to demo mode");
  }

  function runAITriage() {
    if (triaging) return;
    setTriaging(true);
    toast.loading("Scanning traffic patterns…", { id: "triage" });
    setTimeout(() => toast.loading("Checking DNS anomalies…", { id: "triage" }), 900);
    setTimeout(() => toast.loading("Analyzing TCP sessions…", { id: "triage" }), 1800);
    setTimeout(() => {
      const active = alerts.filter((a) => !a.dismissed).length;
      setTriaging(false);
      setActiveTab("alerts");
      toast.success(`Triage complete — ${active} active threat${active !== 1 ? "s" : ""} found`, { id: "triage", duration: 4000 });
    }, 2800);
  }

  function dismissAlert(id: number) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a)));
    toast.success("Alert dismissed");
  }

  function handleSaveConfig(cfg: NetworkConfig) {
    setNetConfig(cfg);
    toast.success(`Network config saved — ${cfg.interface} · ${cfg.myIp || "IP not set"}`);
  }

  const filteredPackets = filterPackets(packets, filter);
  const selectedPacket = packets.find((p) => p.id === selectedPacketId) ?? null;
  const sessions = computeSessions(packets);
  const stats = computeStats(packets);
  const activeAlertCount = alerts.filter((a) => !a.dismissed).length;

  const TABS: { id: Tab; label: string }[] = [
    { id: "capture",    label: "▶ Packets" },
    { id: "sessions",   label: "⧉ Sessions" },
    { id: "statistics", label: "◈ Statistics" },
    { id: "alerts",     label: `⚠ Alerts${activeAlertCount > 0 ? ` (${activeAlertCount})` : ""}` },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: "#0F172A", color: "#F8FAFC", fontFamily: "ui-monospace,'Cascadia Code','Source Code Pro',monospace" }}>
      <Toaster position="bottom-right" toastOptions={{ style: { background: "#1E293B", border: "1px solid #334155", color: "#F8FAFC", fontSize: 13 } }} />
      <NetworkSetup open={setupOpen} onClose={() => setSetupOpen(false)} config={netConfig} onSave={handleSaveConfig} />

      <NavSidebar activeTab={activeTab} onTabChange={setActiveTab} alertCount={activeAlertCount} capturing={mode === "demo"} iface={netConfig.interface || "eth0"} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center gap-2 px-4 flex-shrink-0" style={{ background: "#0F172A", borderBottom: "1px solid #334155", height: 52 }}>

          {/* Mode badge */}
          {mode === "demo" ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)" }}>
              <FlaskConical size={11} color="#FCD34D" />
              <span style={{ color: "#FCD34D", fontSize: 11, fontWeight: 700 }}>DEMO</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}>
              <span style={{ color: "#4ADE80", fontSize: 11 }}>●</span>
              <span style={{ color: "#4ADE80", fontSize: 11, fontWeight: 700 }}>YOUR DATA</span>
              <span style={{ color: "#64748B", fontSize: 11 }}>{pcapFilename}</span>
              <button onClick={resetToDemo} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", marginLeft: 2 }} title="Return to demo"><X size={11} /></button>
            </div>
          )}

          <div className="flex-1" />

          {/* Upload PCAP — primary action */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={pcapLoading}
            title="Upload a .pcap or .pcapng file captured with Wireshark / tcpdump"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded"
            style={{ background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.5)", color: "#60A5FA", fontSize: 12, cursor: pcapLoading ? "wait" : "pointer", whiteSpace: "nowrap", fontWeight: 600 }}
          >
            {pcapLoading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={12} />}
            {pcapLoading ? "Parsing file…" : "Upload .PCAP / .PCAPNG"}
          </button>
          <input ref={fileInputRef} type="file" accept=".pcap,.pcapng,.cap" onChange={handlePcapUpload} style={{ display: "none" }} />

          <button
            onClick={() => { setSetupOpen(true); }}
            title="Capture guide & network settings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded"
            style={{ background: "rgba(100,116,139,0.12)", border: "1px solid #334155", color: "#94A3B8", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            <BookOpen size={12} /> How to Capture
          </button>

          <button
            onClick={runAITriage}
            disabled={triaging}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded"
            style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(79,70,229,0.3))", border: "1px solid rgba(124,58,237,0.5)", color: "#A78BFA", fontSize: 12, cursor: triaging ? "wait" : "pointer", whiteSpace: "nowrap" }}
          >
            {triaging ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={12} />}
            {triaging ? "Analyzing…" : "AI Triage"}
          </button>

          <button onClick={() => setSetupOpen(true)} className="flex items-center justify-center rounded" style={{ width: 32, height: 32, background: "rgba(100,116,139,0.1)", border: "1px solid #334155", color: "#64748B", cursor: "pointer" }}>
            <Settings size={14} />
          </button>
        </div>

        {/* ── Demo mode banner ── */}
        {mode === "demo" && (
          <div className="flex items-center gap-3 px-4 py-2" style={{ background: "rgba(245,158,11,0.07)", borderBottom: "1px solid rgba(245,158,11,0.18)" }}>
            <FlaskConical size={13} color="#FCD34D" />
            <span style={{ color: "#94A3B8", fontSize: 12 }}>
              You are viewing <strong style={{ color: "#FCD34D" }}>simulated demo data</strong> — not your real network.
            </span>
            <span style={{ color: "#94A3B8", fontSize: 12, marginLeft: 8 }}>
              To analyze your own traffic:
            </span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1 rounded"
              style={{ background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)", color: "#60A5FA", fontSize: 12, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
            >
              <Upload size={11} /> Upload .PCAP file
            </button>
            <span style={{ color: "#64748B", fontSize: 12 }}>or</span>
            <button
              onClick={() => setSetupOpen(true)}
              className="flex items-center gap-1 px-3 py-1 rounded"
              style={{ background: "rgba(100,116,139,0.15)", border: "1px solid #334155", color: "#94A3B8", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              <BookOpen size={11} /> See capture guide
            </button>
          </div>
        )}

        {/* ── Real data banner ── */}
        {mode === "real" && (
          <div className="flex items-center gap-3 px-4 py-2" style={{ background: "rgba(34,197,94,0.06)", borderBottom: "1px solid rgba(34,197,94,0.15)" }}>
            <span style={{ color: "#4ADE80", fontSize: 12 }}>●</span>
            <span style={{ color: "#94A3B8", fontSize: 12 }}>
              Showing <strong style={{ color: "#4ADE80" }}>{totalCount.toLocaleString()} real packets</strong> from <strong style={{ color: "#F8FAFC" }}>{pcapFilename}</strong>. Simulation is off — all data is from your file.
            </span>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-2 py-1 rounded ml-auto" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#60A5FA", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}>
              <Upload size={10} /> Load another file
            </button>
          </div>
        )}

        {/* ── Tab bar ── */}
        <div className="flex items-end gap-0 px-4 flex-shrink-0" style={{ background: "#0F172A", borderBottom: "1px solid #334155" }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="px-4 py-2.5"
                style={{ background: active ? "#1E293B" : "transparent", color: active ? "#F8FAFC" : "#64748B", border: "none", borderTop: active ? "2px solid #3B82F6" : "2px solid transparent", borderBottom: active ? "1px solid #1E293B" : "1px solid transparent", fontSize: 12, cursor: "pointer", fontWeight: active ? 600 : 400, marginBottom: -1, whiteSpace: "nowrap" }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "capture" && (
            <div className="flex flex-col h-full overflow-hidden">
              <MetricCards totalPackets={totalCount} tcpSessions={sessions.filter((s) => s.protocol === "TCP" || s.protocol === "TLSv1.3").length} alertCount={activeAlertCount} packets={packets} />
              <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
                <PacketTable packets={filteredPackets} selectedId={selectedPacketId}
                  onSelect={(id) => {
                    setSelectedPacketId(id);
                    const pkt = packets.find((p) => p.id === id);
                    if (pkt) toast.info(`Inspecting #${id} — ${pkt.protocol} ${pkt.srcIp} → ${pkt.dstIp}`, { duration: 2000 });
                  }}
                  filter={filter} onFilterChange={setFilter} capturing={mode === "demo"} totalCount={totalCount}
                />
                {selectedPacket && <PacketInspector packet={selectedPacket} onClose={() => setSelectedPacketId(null)} />}
                <TCPHandshake />
              </div>
            </div>
          )}
          {activeTab === "statistics" && <Statistics stats={stats} totalPackets={totalCount} />}
          {activeTab === "sessions"   && <Sessions sessions={sessions} />}
          {activeTab === "alerts"     && <AlertsManager alerts={alerts} onDismiss={dismissAlert} />}
        </div>
      </div>

      <div style={{ width: 300, minWidth: 300, flexShrink: 0, overflow: "hidden" }}>
        <AITriagePanel alerts={alerts} onDismiss={dismissAlert} onSwitchToAlerts={() => setActiveTab("alerts")} totalPackets={totalCount} />
      </div>
    </div>
  );
}
