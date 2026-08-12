import { useState, useEffect, useRef } from "react";
import { Zap, Loader2, Settings, Upload, FlaskConical, BookOpen, X, Radio, Clock } from "lucide-react";
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

const FONT = "'Inter', ui-sans-serif, system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace";

function LiveClock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString("en-US", { hour12: false }));
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString("en-US", { hour12: false })), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(13,31,51,0.8)", border: "1px solid #1C3A56" }}>
      <Clock size={10} style={{ color: "#3D6275" }} />
      <span style={{ color: "#7EA4C2", fontSize: 11, fontFamily: MONO, letterSpacing: "0.04em" }}>{time}</span>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState<Mode>("demo");
  const [pcapFilename, setPcapFilename] = useState<string>("");

  const [packets, setPackets]   = useState<Packet[]>(initialPackets);
  const [alerts, setAlerts]     = useState<Alert[]>(initialAlerts);

  const demoRunning      = useRef(true);
  const intervalRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const countIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [filter, setFilter]             = useState("");
  const [selectedPacketId, setSelectedPacketId] = useState<number | null>(null);
  const [activeTab, setActiveTab]       = useState<Tab>("capture");
  const [pcapLoading, setPcapLoading]   = useState(false);
  const [triaging, setTriaging]         = useState(false);
  const [setupOpen, setSetupOpen]       = useState(false);
  const [netConfig, setNetConfig]       = useState<NetworkConfig>(loadNetworkConfig);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [totalCount, setTotalCount]     = useState(initialPackets.length);

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

  function stopDemo() {
    demoRunning.current = false;
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (countIntervalRef.current) { clearInterval(countIntervalRef.current); countIntervalRef.current = null; }
  }

  useEffect(() => {
    startDemo();
    return () => stopDemo();
  }, []);

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
          `No supported packets found. Format: ${result.format}, Skipped: ${result.skipped}.`,
          { id: "pcap", duration: 8000 }
        );
        setPcapLoading(false);
        return;
      }

      stopDemo();
      setPackets(result.packets);
      setTotalCount(result.packets.length);
      setSelectedPacketId(null);
      setFilter("");
      setMode("real");
      setPcapFilename(file.name);
      setActiveTab("capture");

      toast.success(
        `Loaded ${result.packets.length.toLocaleString()} packets from ${file.name} (${result.format.toUpperCase()})`,
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

  const filteredPackets  = filterPackets(packets, filter);
  const selectedPacket   = packets.find((p) => p.id === selectedPacketId) ?? null;
  const sessions         = computeSessions(packets);
  const stats            = computeStats(packets);
  const activeAlertCount = alerts.filter((a) => !a.dismissed).length;

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "capture",    label: "Packets",    icon: "⬡" },
    { id: "sessions",   label: "Sessions",   icon: "⧉" },
    { id: "statistics", label: "Statistics", icon: "◈" },
    { id: "alerts",     label: "Alerts",     icon: "⚠" },
  ];

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: "#060C16", color: "#E8F1FF", fontFamily: FONT }}
    >
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#0D1F33",
            border: "1px solid #1C3A56",
            color: "#E8F1FF",
            fontSize: 12,
            fontFamily: FONT,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          },
        }}
      />
      <NetworkSetup open={setupOpen} onClose={() => setSetupOpen(false)} config={netConfig} onSave={handleSaveConfig} />

      <NavSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        alertCount={activeAlertCount}
        capturing={mode === "demo"}
        iface={netConfig.interface || "eth0"}
        onOpenPcap={() => fileInputRef.current?.click()}
        onOpenSettings={() => setSetupOpen(true)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── Header ── */}
        <div
          className="flex items-center gap-2 px-4 flex-shrink-0"
          style={{ background: "#08111D", borderBottom: "1px solid #1C3A56", height: 52 }}
        >
          {/* Mode badge */}
          {mode === "demo" ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(255,173,31,0.08)", border: "1px solid rgba(255,173,31,0.25)" }}
            >
              <FlaskConical size={11} style={{ color: "#FFAD1F" }} />
              <span style={{ color: "#FFAD1F", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>DEMO MODE</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(0,232,147,0.07)", border: "1px solid rgba(0,232,147,0.2)" }}
            >
              <span className="live-dot" style={{ color: "#00E893", fontSize: 8 }}>●</span>
              <span style={{ color: "#00E893", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>LIVE DATA</span>
              <span style={{ color: "#3D6275", fontSize: 10, fontFamily: MONO }}>{pcapFilename}</span>
              <button
                onClick={resetToDemo}
                style={{ color: "#3D6275", background: "none", border: "none", cursor: "pointer", marginLeft: 2, lineHeight: 1 }}
                title="Return to demo"
              >
                <X size={11} />
              </button>
            </div>
          )}

          {/* Radio/live pulse for demo */}
          {mode === "demo" && (
            <div className="flex items-center gap-1">
              <Radio size={10} style={{ color: "#FFAD1F" }} className="live-dot" />
            </div>
          )}

          <div className="flex-1" />

          <LiveClock />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={pcapLoading}
            className="soc-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{
              background: "rgba(61,142,255,0.12)",
              border: "1px solid rgba(61,142,255,0.35)",
              color: "#7AB8FF",
              fontSize: 11,
              fontWeight: 600,
              cursor: pcapLoading ? "wait" : "pointer",
              whiteSpace: "nowrap",
              fontFamily: FONT,
            }}
          >
            {pcapLoading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={12} />}
            {pcapLoading ? "Parsing…" : "Upload PCAP"}
          </button>
          <input ref={fileInputRef} type="file" accept=".pcap,.pcapng,.cap" onChange={handlePcapUpload} style={{ display: "none" }} />

          <button
            onClick={() => setSetupOpen(true)}
            className="soc-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(13,31,51,0.8)", border: "1px solid #1C3A56", color: "#7EA4C2", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap", fontFamily: FONT }}
          >
            <BookOpen size={12} /> Capture Guide
          </button>

          <button
            onClick={runAITriage}
            disabled={triaging}
            className="soc-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{
              background: "linear-gradient(135deg,rgba(155,110,255,0.2),rgba(79,70,229,0.2))",
              border: "1px solid rgba(155,110,255,0.4)",
              color: "#B89AFF",
              fontSize: 11,
              fontWeight: 600,
              cursor: triaging ? "wait" : "pointer",
              whiteSpace: "nowrap",
              fontFamily: FONT,
              boxShadow: "0 0 16px rgba(155,110,255,0.15)",
            }}
          >
            {triaging ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={12} />}
            {triaging ? "Analyzing…" : "AI Triage"}
          </button>

          <button
            onClick={() => setSetupOpen(true)}
            className="soc-btn flex items-center justify-center rounded-lg"
            style={{ width: 34, height: 34, background: "rgba(13,31,51,0.8)", border: "1px solid #1C3A56", color: "#3D6275", cursor: "pointer" }}
          >
            <Settings size={14} />
          </button>
        </div>

        {/* ── Demo mode banner ── */}
        {mode === "demo" && (
          <div
            className="flex items-center gap-3 px-4 py-2"
            style={{ background: "rgba(255,173,31,0.04)", borderBottom: "1px solid rgba(255,173,31,0.12)" }}
          >
            <FlaskConical size={12} style={{ color: "#FFAD1F", flexShrink: 0 }} />
            <span style={{ color: "#7EA4C2", fontSize: 11 }}>
              Viewing <strong style={{ color: "#FFAD1F" }}>simulated demo data</strong> — not real network traffic.
            </span>
            <span style={{ color: "#3D6275", fontSize: 11 }}>Analyze your own traffic:</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="soc-btn flex items-center gap-1 px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(61,142,255,0.12)", border: "1px solid rgba(61,142,255,0.3)", color: "#7AB8FF", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
            >
              <Upload size={10} /> Upload .PCAP
            </button>
            <span style={{ color: "#254560", fontSize: 11 }}>or</span>
            <button
              onClick={() => setSetupOpen(true)}
              className="soc-btn flex items-center gap-1 px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(13,31,51,0.8)", border: "1px solid #1C3A56", color: "#7EA4C2", fontSize: 11, cursor: "pointer" }}
            >
              <BookOpen size={10} /> Capture guide
            </button>
          </div>
        )}

        {/* ── Real data banner ── */}
        {mode === "real" && (
          <div
            className="flex items-center gap-3 px-4 py-2"
            style={{ background: "rgba(0,232,147,0.04)", borderBottom: "1px solid rgba(0,232,147,0.12)" }}
          >
            <span className="live-dot" style={{ color: "#00E893", fontSize: 8 }}>●</span>
            <span style={{ color: "#7EA4C2", fontSize: 11 }}>
              Showing <strong style={{ color: "#00E893" }}>{totalCount.toLocaleString()} real packets</strong> from{" "}
              <strong style={{ color: "#E8F1FF", fontFamily: MONO }}>{pcapFilename}</strong>
            </span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="soc-btn flex items-center gap-1 px-2.5 py-1 rounded-lg ml-auto"
              style={{ background: "rgba(61,142,255,0.08)", border: "1px solid rgba(61,142,255,0.25)", color: "#7AB8FF", fontSize: 11, cursor: "pointer" }}
            >
              <Upload size={10} /> Load another file
            </button>
          </div>
        )}

        {/* ── Tab bar ── */}
        <div
          className="flex items-end gap-0 px-4 flex-shrink-0"
          style={{ background: "#08111D", borderBottom: "1px solid #1C3A56" }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const hasAlert = tab.id === "alerts" && activeAlertCount > 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2.5 flex items-center gap-1.5 relative"
                style={{
                  background: active ? "rgba(61,142,255,0.08)" : "transparent",
                  color: active ? "#7AB8FF" : hasAlert ? "#FF8098" : "#3D6275",
                  border: "none",
                  borderBottom: active ? "2px solid #3D8EFF" : "2px solid transparent",
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: FONT,
                  marginBottom: -1,
                  transition: "color 0.15s ease",
                  letterSpacing: "0.02em",
                }}
              >
                <span style={{ fontSize: 10, opacity: 0.7 }}>{tab.icon}</span>
                {tab.label}
                {hasAlert && (
                  <span
                    className="rounded-full"
                    style={{ background: "#FF3553", color: "#fff", fontSize: 9, fontWeight: 700, minWidth: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", boxShadow: "0 0 6px rgba(255,53,83,0.5)" }}
                  >
                    {activeAlertCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-hidden" style={{ background: "#060C16" }}>
          {activeTab === "capture" && (
            <div className="flex flex-col h-full overflow-hidden">
              <MetricCards
                totalPackets={totalCount}
                tcpSessions={sessions.filter((s) => s.protocol === "TCP" || s.protocol === "TLSv1.3").length}
                alertCount={activeAlertCount}
                packets={packets}
              />
              <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
                <PacketTable
                  packets={filteredPackets}
                  selectedId={selectedPacketId}
                  onSelect={(id) => {
                    setSelectedPacketId(id);
                    const pkt = packets.find((p) => p.id === id);
                    if (pkt) toast.info(`#${id} — ${pkt.protocol} ${pkt.srcIp} → ${pkt.dstIp}`, { duration: 2000 });
                  }}
                  filter={filter}
                  onFilterChange={setFilter}
                  capturing={mode === "demo"}
                  totalCount={totalCount}
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

      {/* ── AI Triage Panel ── */}
      <div style={{ width: 296, minWidth: 296, flexShrink: 0, overflow: "hidden" }}>
        <AITriagePanel
          alerts={alerts}
          onDismiss={dismissAlert}
          onSwitchToAlerts={() => setActiveTab("alerts")}
          totalPackets={totalCount}
        />
      </div>
    </div>
  );
}
