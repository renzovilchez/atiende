import { useState, useEffect, memo } from "react";

const LiveClock = memo(function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const date = now.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const time = now.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "America/Lima",
  });

  // Capitalizar primera letra
  const dateFormatted = date.charAt(0).toUpperCase() + date.slice(1);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <div
        style={{
          fontSize: "20px",
          fontWeight: 700,
          color: "#0f172a",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.02em",
        }}
      >
        {time}
      </div>
      <div
        style={{
          width: "1px",
          height: "24px",
          background: "#e2e8f0",
        }}
      />
      <div
        style={{
          fontSize: "14px",
          color: "#475569",
          fontWeight: 500,
        }}
      >
        {dateFormatted}
      </div>
    </div>
  );
});

export default LiveClock;
