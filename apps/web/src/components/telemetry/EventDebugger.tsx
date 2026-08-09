import React from 'react';
import { useMediaEvents } from '@mediaforge/media-react';

export function EventDebugger() {
  const [eventLogs, setEventLogs] = React.useState<string[]>([]);

  useMediaEvents('view', (event) => {
    const time = new Date(event.timestamp).toLocaleTimeString();
    setEventLogs((prev) => [`[${time}] VIEW: ${event.mediaType} #${event.mediaId}`, ...prev.slice(0, 4)]);
  });

  useMediaEvents('download', (event) => {
    const time = new Date(event.timestamp).toLocaleTimeString();
    setEventLogs((prev) => [`[${time}] DOWNLOAD: ${event.mediaType} #${event.mediaId}`, ...prev.slice(0, 4)]);
  });

  if (eventLogs.length === 0) return null;

  return (
    <aside className="mf-telemetry-panel" aria-label="SDK Telemetry Event Debugger">
      <div className="mf-telemetry-title">📡 SDK Event Log ({eventLogs.length})</div>
      {eventLogs.map((log, idx) => (
        <div key={idx} style={{ color: log.includes('DOWNLOAD') ? '#38bdf8' : '#a3e635' }}>
          {log}
        </div>
      ))}
    </aside>
  );
}
