import { CheckCircle } from "lucide-react";

const FONT = "'Inter', ui-sans-serif, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

const steps = [
  { label: "1. SYN",     detail: "[Seq=0, Win=64240]", direction: "right" as const, time: "0.00 ms",  color: "#3D8EFF" },
  { label: "2. SYN-ACK", detail: "[Seq=0, Ack=1]",     direction: "left"  as const, time: "+15.1 ms", color: "#9B6EFF" },
  { label: "3. ACK",     detail: "[Seq=1, Ack=1]",     direction: "right" as const, time: "+16.2 ms", color: "#00E893" },
];

export function TCPHandshake() {
  return (
    <div className="rounded-xl p-4" style={{ background: "#0D1F33", border: "1px solid #1C3A56" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div style={{ width: 3, height: 14, background: "linear-gradient(180deg,#3D8EFF,#9B6EFF)", borderRadius: 2 }} />
          <h3 style={{ color: "#E8F1FF", fontSize: 12, fontWeight: 600, margin: 0, fontFamily: FONT }}>TCP Handshake Sequence Inspector</h3>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
          style={{ background: "rgba(0,232,147,0.08)", border: "1px solid rgba(0,232,147,0.2)" }}
        >
          <CheckCircle size={11} style={{ color: "#00E893" }} />
          <span style={{ color: "#00E893", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", fontFamily: FONT }}>ESTABLISHED</span>
        </div>
      </div>

      {/* Diagram */}
      <div className="flex flex-col gap-0">
        {/* Column headers */}
        <div className="flex items-center mb-3">
          <div className="flex-1 flex items-center gap-2">
            <div
              className="px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(61,142,255,0.1)", border: "1px solid rgba(61,142,255,0.25)", color: "#7AB8FF", fontSize: 10, fontWeight: 600, fontFamily: MONO }}
            >
              Client: 192.168.1.50
            </div>
          </div>
          <div className="flex-1 flex items-center justify-end gap-2">
            <div
              className="px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(155,110,255,0.1)", border: "1px solid rgba(155,110,255,0.25)", color: "#B89AFF", fontSize: 10, fontWeight: 600, fontFamily: MONO }}
            >
              Server: 140.82.121.4
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical lines */}
          <div className="absolute" style={{ left: "12%", top: 0, bottom: 0, width: 1, background: "rgba(61,142,255,0.2)", transform: "translateX(-50%)" }} />
          <div className="absolute" style={{ right: "12%", top: 0, bottom: 0, width: 1, background: "rgba(155,110,255,0.2)", transform: "translateX(50%)" }} />

          <div className="flex flex-col gap-4 py-2">
            {steps.map((step) => (
              <div key={step.label} className="relative flex items-center px-4" style={{ height: 40 }}>
                {/* Left dot */}
                <div
                  className="absolute rounded-full"
                  style={{ left: "12%", width: 8, height: 8, background: step.color, boxShadow: `0 0 10px ${step.color}`, transform: "translate(-50%, -50%)", top: "50%" }}
                />
                {/* Right dot */}
                <div
                  className="absolute rounded-full"
                  style={{ right: "12%", width: 8, height: 8, background: step.color, boxShadow: `0 0 10px ${step.color}`, transform: "translate(50%, -50%)", top: "50%" }}
                />

                {/* Arrow line */}
                <div
                  className="absolute flex items-center"
                  style={{ left: "calc(12% + 8px)", right: "calc(12% + 8px)", top: "50%", transform: "translateY(-50%)" }}
                >
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(${step.direction === "right" ? "90deg" : "270deg"}, transparent, ${step.color}80)` }} />
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
                    className="px-2.5 py-0.5 rounded-lg text-center"
                    style={{ background: "#08111D", border: `1px solid ${step.color}40`, whiteSpace: "nowrap" }}
                  >
                    <span style={{ color: step.color, fontSize: 10, fontWeight: 700, fontFamily: MONO }}>{step.label}</span>
                    <span style={{ color: "#3D6275", fontSize: 9, marginLeft: 5, fontFamily: MONO }}>{step.detail}</span>
                  </div>
                </div>

                {/* Time badge */}
                <div className="absolute" style={{ right: 0, top: "50%", transform: "translateY(-50%)", whiteSpace: "nowrap" }}>
                  <span style={{ color: "#3D6275", fontSize: 9, fontFamily: MONO }}>{step.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-center gap-6 mt-3 pt-3"
          style={{ borderTop: "1px solid #1C3A56" }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={12} style={{ color: "#00E893" }} />
            <span style={{ color: "#7EA4C2", fontSize: 11, fontFamily: FONT }}>
              Status: <span style={{ color: "#00E893", fontWeight: 600 }}>ESTABLISHED</span>
            </span>
          </div>
          <div style={{ width: 1, height: 14, background: "#1C3A56" }} />
          <span style={{ color: "#7EA4C2", fontSize: 11, fontFamily: FONT }}>
            RTT: <span style={{ color: "#3D8EFF", fontWeight: 600, fontFamily: MONO }}>16.2 ms</span>
          </span>
        </div>
      </div>
    </div>
  );
}
