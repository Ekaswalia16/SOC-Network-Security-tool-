import React, { useState, useEffect } from "react";
import { X, Settings, Terminal, Monitor, HelpCircle, CheckCircle, Copy, ChevronRight } from "lucide-react";

export type NetworkConfig = {
  myIp: string;
  interface: string;
  subnet: string;
  gateway: string;
};

const DEFAULT_CONFIG: NetworkConfig = { myIp: "", interface: "eth0", subnet: "192.168.1.0/24", gateway: "" };
const LS_KEY = "netinspect.networkConfig";

export function loadNetworkConfig(): NetworkConfig {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch {}
  return { ...DEFAULT_CONFIG };
}

function saveNetworkConfig(cfg: NetworkConfig) {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg));
}

type Tab = "config" | "capture" | "help";

const CMD_STYLE: React.CSSProperties = {
  background: "#0F172A",
  border: "1px solid #334155",
  borderRadius: 6,
  padding: "10px 14px",
  fontFamily: "ui-monospace,monospace",
  fontSize: 12,
  color: "#4ADE80",
  overflowX: "auto",
  whiteSpace: "pre",
  cursor: "pointer",
  position: "relative",
};

function CmdBlock({ cmd, label }: { cmd: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div style={{ color: "#64748B", fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={CMD_STYLE} onClick={() => { navigator.clipboard.writeText(cmd).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
        {cmd}
        <span style={{ position: "absolute", top: 6, right: 8, color: copied ? "#4ADE80" : "#475569", fontSize: 10 }}>{copied ? "✓ Copied" : "click to copy"}</span>
      </div>
    </div>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  config: NetworkConfig;
  onSave: (cfg: NetworkConfig) => void;
};

export function NetworkSetup({ open, onClose, config, onSave }: Props) {
  const [tab, setTab] = useState<Tab>("config");
  const [form, setForm] = useState<NetworkConfig>(config);

  useEffect(() => { setForm(config); }, [config, open]);

  if (!open) return null;

  function handleSave() {
    saveNetworkConfig(form);
    onSave(form);
    onClose();
  }

  const tabs: { id: Tab; label: string; icon: typeof Settings }[] = [
    { id: "config",  label: "My Network",   icon: Settings },
    { id: "capture", label: "Capture Guide", icon: Terminal },
    { id: "help",    label: "Filter Help",   icon: HelpCircle },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="flex flex-col rounded-xl overflow-hidden shadow-2xl" style={{ background: "#1E293B", border: "1px solid #334155", width: 680, maxHeight: "86vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #334155", background: "#0F172A" }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded" style={{ background: "linear-gradient(135deg,#3B82F6,#8B5CF6)", width: 28, height: 28 }}>
              <Settings size={14} color="#fff" />
            </div>
            <div>
              <div style={{ color: "#F8FAFC", fontSize: 14, fontWeight: 700 }}>Network Configuration</div>
              <div style={{ color: "#64748B", fontSize: 11 }}>Set up NetInspect to work with your network</div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: "#64748B", background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex" style={{ borderBottom: "1px solid #334155", background: "#0F172A" }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-2 px-4 py-2.5"
                style={{ background: "none", border: "none", borderBottom: active ? "2px solid #3B82F6" : "2px solid transparent", color: active ? "#F8FAFC" : "#64748B", fontSize: 13, cursor: "pointer", fontWeight: active ? 600 : 400 }}>
                <Icon size={13} />{t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 flex flex-col gap-4" style={{ flex: 1 }}>

          {/* ── My Network tab ── */}
          {tab === "config" && (
            <>
              <div style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1.6 }}>
                Enter your network details so NetInspect can correctly label traffic as <strong style={{ color: "#60A5FA" }}>inbound</strong> or <strong style={{ color: "#A78BFA" }}>outbound</strong> and identify your host in the packet stream.
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Your IP Address", key: "myIp", placeholder: "e.g. 192.168.1.50", hint: "Run: ip addr  or  ipconfig" },
                  { label: "Interface Name", key: "interface", placeholder: "e.g. eth0, en0, Wi-Fi", hint: "Run: ip link  or  ifconfig" },
                  { label: "Your Subnet (CIDR)", key: "subnet", placeholder: "e.g. 192.168.1.0/24", hint: "Usually /24 for home networks" },
                  { label: "Gateway IP", key: "gateway", placeholder: "e.g. 192.168.1.1", hint: "Run: ip route  or  route print" },
                ].map((field) => (
                  <div key={field.key} className="flex flex-col gap-1">
                    <label style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600 }}>{field.label}</label>
                    <input
                      type="text"
                      value={form[field.key as keyof NetworkConfig]}
                      onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="px-3 py-2 rounded"
                      style={{ background: "#0F172A", border: "1px solid #334155", color: "#F8FAFC", fontSize: 13, fontFamily: "ui-monospace,monospace", outline: "none" }}
                    />
                    <span style={{ color: "#475569", fontSize: 11 }}>{field.hint}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-lg p-3" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <div style={{ color: "#60A5FA", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>How to find your IP quickly</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { os: "Linux / Mac", cmd: "ip addr show\nifconfig" },
                    { os: "Windows", cmd: "ipconfig\nGet-NetIPAddress" },
                    { os: "Any (web)", cmd: "curl ifconfig.me\ncurl ipinfo.io/ip" },
                  ].map((item) => (
                    <div key={item.os} className="rounded p-2" style={{ background: "#0F172A", border: "1px solid #334155" }}>
                      <div style={{ color: "#64748B", fontSize: 10, marginBottom: 4 }}>{item.os}</div>
                      <code style={{ color: "#4ADE80", fontSize: 11, whiteSpace: "pre" }}>{item.cmd}</code>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Capture Guide tab ── */}
          {tab === "capture" && (
            <>
              <div style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1.6 }}>
                Capture traffic on your machine, save it as a <strong style={{ color: "#F8FAFC" }}>.pcap</strong> or <strong style={{ color: "#F8FAFC" }}>.pcapng</strong> file, then click <strong style={{ color: "#60A5FA" }}>Open .PCAP</strong> in the toolbar to analyze it here.
              </div>

              <div className="flex flex-col gap-4">
                {/* Wireshark */}
                <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #334155" }}>
                  <div className="flex items-center gap-2 px-4 py-2" style={{ background: "#0F172A", borderBottom: "1px solid #334155" }}>
                    <Monitor size={14} color="#60A5FA" />
                    <span style={{ color: "#F8FAFC", fontSize: 13, fontWeight: 600 }}>Wireshark (GUI — easiest)</span>
                    <span className="ml-auto px-2 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.1)", color: "#4ADE80", fontSize: 10, border: "1px solid rgba(34,197,94,0.2)" }}>Recommended</span>
                  </div>
                  <div className="px-4 py-3 flex flex-col gap-2">
                    {[
                      "1. Download Wireshark from wireshark.org",
                      "2. Open Wireshark and select your network interface",
                      "3. Click the blue shark fin ▶ to start capture",
                      "4. Do the network activity you want to analyze",
                      "5. Press ⏹ Stop, then File → Save As → Format: pcapng",
                      "6. Upload the saved file here using Open .PCAP",
                    ].map((step) => (
                      <div key={step} className="flex items-start gap-2">
                        <CheckCircle size={13} color="#4ADE80" style={{ marginTop: 1, flexShrink: 0 }} />
                        <span style={{ color: "#94A3B8", fontSize: 12 }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* tcpdump */}
                <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #334155" }}>
                  <div className="flex items-center gap-2 px-4 py-2" style={{ background: "#0F172A", borderBottom: "1px solid #334155" }}>
                    <Terminal size={14} color="#A78BFA" />
                    <span style={{ color: "#F8FAFC", fontSize: 13, fontWeight: 600 }}>tcpdump (Linux / Mac terminal)</span>
                  </div>
                  <div className="px-4 py-3 flex flex-col gap-3">
                    <CmdBlock label="Capture all traffic on eth0 for 30 seconds:" cmd={`sudo tcpdump -i eth0 -w capture.pcap`} />
                    <CmdBlock label="Capture only HTTP/HTTPS (less noise):" cmd={`sudo tcpdump -i eth0 -w capture.pcap 'port 80 or port 443'`} />
                    <CmdBlock label="Capture from a specific host:" cmd={`sudo tcpdump -i eth0 -w capture.pcap host 192.168.1.50`} />
                    <CmdBlock label="List available interfaces first:" cmd={`sudo tcpdump -D\n# or: ip link show`} />
                  </div>
                </div>

                {/* tshark */}
                <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #334155" }}>
                  <div className="flex items-center gap-2 px-4 py-2" style={{ background: "#0F172A", borderBottom: "1px solid #334155" }}>
                    <Terminal size={14} color="#FCD34D" />
                    <span style={{ color: "#F8FAFC", fontSize: 13, fontWeight: 600 }}>tshark (Wireshark CLI)</span>
                  </div>
                  <div className="px-4 py-3 flex flex-col gap-3">
                    <CmdBlock label="Capture 100 packets:" cmd={`tshark -i eth0 -c 100 -w capture.pcapng`} />
                    <CmdBlock label="Capture for 60 seconds:" cmd={`tshark -i eth0 -a duration:60 -w capture.pcapng`} />
                  </div>
                </div>

                <div className="rounded-lg p-3" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <div style={{ color: "#FCD34D", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>⚠ Privacy note</div>
                  <div style={{ color: "#94A3B8", fontSize: 12, lineHeight: 1.6 }}>
                    Only capture traffic on networks you own or have explicit permission to monitor. Your PCAP file is parsed entirely in your browser — no data is sent to any server.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Filter Help tab ── */}
          {tab === "help" && (
            <>
              <div style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1.6 }}>
                Type filters into the search bar in the Capture tab. Filters are case-insensitive and support <code style={{ color: "#60A5FA" }}>&&</code> (AND) and <code style={{ color: "#60A5FA" }}>||</code> (OR).
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { cat: "By IP Address", rows: [
                    { filter: "ip.src == 192.168.1.50",  desc: "Packets FROM a specific source IP" },
                    { filter: "ip.dst == 8.8.8.8",       desc: "Packets TO a specific destination IP" },
                    { filter: "ip == 192.168.1.50",      desc: "All packets involving an IP (either direction)" },
                    { filter: "ip.src contains 10.0.0",  desc: "Source IP starts with 10.0.0.x" },
                  ]},
                  { cat: "By Port", rows: [
                    { filter: "port == 443",    desc: "All HTTPS traffic (any direction)" },
                    { filter: "port == 53",     desc: "All DNS traffic" },
                    { filter: "tcp.port == 22", desc: "SSH traffic specifically" },
                    { filter: "udp.port == 53", desc: "DNS over UDP specifically" },
                  ]},
                  { cat: "By Protocol", rows: [
                    { filter: "protocol == dns",    desc: "DNS queries and responses" },
                    { filter: "protocol == http",   desc: "Unencrypted HTTP traffic" },
                    { filter: "protocol == tlsv1.3",desc: "Encrypted HTTPS/TLS traffic" },
                    { filter: "protocol == icmp",   desc: "Ping requests and replies" },
                    { filter: "protocol == ssh",    desc: "SSH sessions" },
                  ]},
                  { cat: "By Size", rows: [
                    { filter: "length > 1000",  desc: "Large packets (data transfer, video)" },
                    { filter: "length > 500",   desc: "Medium-large packets" },
                  ]},
                  { cat: "Combining filters", rows: [
                    { filter: "ip.src == 192.168.1.50 && port == 443",       desc: "HTTPS traffic from one host" },
                    { filter: "protocol == dns && ip.src contains 192.168.", desc: "DNS from internal network" },
                    { filter: "protocol == icmp || protocol == arp",          desc: "Network discovery traffic" },
                  ]},
                  { cat: "Free text search", rows: [
                    { filter: "github.com",      desc: "Any packet mentioning github.com (DNS, TLS SNI)" },
                    { filter: "401",             desc: "Packets with 401 in their info (auth failures)" },
                    { filter: "SYN",             desc: "TCP SYN packets (connection attempts)" },
                  ]},
                ].map((section) => (
                  <div key={section.cat} className="rounded-lg overflow-hidden" style={{ border: "1px solid #334155" }}>
                    <div className="px-3 py-2" style={{ background: "#0F172A", borderBottom: "1px solid #334155" }}>
                      <span style={{ color: "#94A3B8", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" }}>{section.cat.toUpperCase()}</span>
                    </div>
                    <div className="flex flex-col">
                      {section.rows.map((row, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2" style={{ borderBottom: i < section.rows.length - 1 ? "1px solid rgba(51,65,85,0.5)" : "none" }}>
                          <code style={{ color: "#60A5FA", fontSize: 11, fontFamily: "monospace", minWidth: 280 }}>{row.filter}</code>
                          <span style={{ color: "#64748B", fontSize: 12 }}>{row.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #334155", background: "#0F172A" }}>
          <button onClick={onClose} className="px-4 py-2 rounded" style={{ background: "rgba(100,116,139,0.15)", color: "#94A3B8", border: "1px solid #334155", fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
          {tab === "config" && (
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded" style={{ background: "rgba(59,130,246,0.2)", color: "#60A5FA", border: "1px solid rgba(59,130,246,0.4)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
              <CheckCircle size={13} /> Save Configuration
            </button>
          )}
          {tab !== "config" && (
            <button onClick={() => setTab(tab === "capture" ? "help" : "config")} className="flex items-center gap-2 px-4 py-2 rounded" style={{ background: "rgba(59,130,246,0.15)", color: "#60A5FA", border: "1px solid rgba(59,130,246,0.3)", fontSize: 13, cursor: "pointer" }}>
              Next <ChevronRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
