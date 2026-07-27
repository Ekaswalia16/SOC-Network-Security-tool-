import { CheckCircle } from "lucide-react";

const steps = [
  {
    label: "1. SYN",
    detail: "[Seq=0, Win=64240]",
    direction: "right" as const,
    time: "0.00 ms",
    color: "#60A5FA",
  },
  {
    label: "2. SYN-ACK",
    detail: "[Seq=0, Ack=1]",
    direction: "left" as const,
    time: "+15.1 ms",
    color: "#A78BFA",
  },
  {
    label: "3. ACK",
    detail: "[Seq=1, Ack=1]",
    direction: "right" as const,
    time: "+16.2 ms",
    color: "#34D399",
  },
];

export function TCPHandshake() {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "#1E293B", border: "1px solid #334155" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ color: "#F8FAFC", fontSize: 13, fontWeight: 600 }}>TCP Handshake Sequence Inspector</h3>
        <div
          className="flex items-center gap-1 px-2 py-1 rounded"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}
        >
          <CheckCircle size={11} color="#4ADE80" />
          <span style={{ color: "#4ADE80", fontSize: 11 }}>ESTABLISHED</span>
        </div>
      </div>

      {/* Diagram */}
      <div className="flex flex-col gap-0">
        {/* Column headers */}
        <div className="flex items-center mb-3">
          <div className="flex-1 flex items-center gap-2">
            <div
              className="px-2 py-1 rounded"
              style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#60A5FA", fontSize: 11, fontWeight: 600 }}
            >
              Client: 192.168.1.50
            </div>
          </div>
          <div className="flex-1 flex items-center justify-end gap-2">
            <div
              className="px-2 py-1 rounded"
              style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#A78BFA", fontSize: 11, fontWeight: 600 }}
            >
              Server: 140.82.121.4
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical lines */}
          <div
            className="absolute"
            style={{ left: "12%", top: 0, bottom: 0, width: 1, background: "rgba(59,130,246,0.3)", transform: "translateX(-50%)" }}
          />
          <div
            className="absolute"
            style={{ right: "12%", top: 0, bottom: 0, width: 1, background: "rgba(139,92,246,0.3)", transform: "translateX(50%)" }}
          />

          <div className="flex flex-col gap-4 py-2">
            {steps.map((step) => (
              <div key={step.label} className="relative flex items-center px-4" style={{ height: 40 }}>
                {/* Left dot */}
                <div
                  className="absolute rounded-full"
                  style={{
                    left: "12%",
                    width: 8,
                    height: 8,
                    background: step.color,
                    boxShadow: `0 0 6px ${step.color}`,
                    transform: "translate(-50%, -50%)",
                    top: "50%",
                  }}
                />
                {/* Right dot */}
                <div
                  className="absolute rounded-full"
                  style={{
                    right: "12%",
                    width: 8,
                    height: 8,
                    background: step.color,
                    boxShadow: `0 0 6px ${step.color}`,
                    transform: "translate(50%, -50%)",
                    top: "50%",
                  }}
                />

                {/* Arrow line */}
                <div
                  className="absolute flex items-center"
                  style={{
                    left: "calc(12% + 8px)",
                    right: "calc(12% + 8px)",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(${step.direction === "right" ? "90deg" : "270deg"}, transparent, ${step.color})` }} />
                  {/* Arrow head */}
                  {step.direction === "right" ? (
                    <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: `6px solid ${step.color}` }} />
                  ) : (
                    <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderRight: `6px solid ${step.color}`, order: -1 }} />
                  )}
                </div>

                {/* Label */}
                <div
                  className="absolute flex flex-col items-center"
                  style={{ left: "50%", transform: "translate(-50%, -50%)", top: "50%", zIndex: 10 }}
                >
                  <div
                    className="px-2 py-0.5 rounded text-center"
                    style={{ background: "#0F172A", border: `1px solid ${step.color}40`, whiteSpace: "nowrap" }}
                  >
                    <span style={{ color: step.color, fontSize: 11, fontWeight: 700 }}>{step.label}</span>
                    <span style={{ color: "#94A3B8", fontSize: 10, marginLeft: 4 }}>{step.detail}</span>
                  </div>
                </div>

                {/* Time badge */}
                <div
                  className="absolute"
                  style={{ right: 0, top: "50%", transform: "translateY(-50%)", whiteSpace: "nowrap" }}
                >
                  <span style={{ color: "#64748B", fontSize: 10, fontFamily: "monospace" }}>{step.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-center gap-4 mt-3 pt-3 rounded"
          style={{ borderTop: "1px solid #334155" }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={13} color="#4ADE80" />
            <span style={{ color: "#94A3B8", fontSize: 12 }}>Status: <span style={{ color: "#4ADE80", fontWeight: 600 }}>ESTABLISHED</span></span>
          </div>
          <div style={{ width: 1, height: 16, background: "#334155" }} />
          <span style={{ color: "#94A3B8", fontSize: 12 }}>
            Total Handshake RTT: <span style={{ color: "#60A5FA", fontWeight: 600, fontFamily: "monospace" }}>16.2 ms</span>
          </span>
        </div>
      </div>
    </div>
  );
}
