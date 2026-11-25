"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

export type MotrVehicle = {
  registration: string;
  make: string;
  model: string;
  year: string;
  colour: string;
};

export function validVehicle(value: unknown): value is MotrVehicle {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.registration === "string" && /^[A-Z0-9]{2,8}$/.test(v.registration)
    && [v.make, v.model].every(x => typeof x === "string" && x.trim().length > 0 && x.length <= 100)
    && typeof v.year === "string" && (v.year === "" || (/^\d{4}$/.test(v.year)
      && Number(v.year) >= 1886 && Number(v.year) <= new Date().getFullYear() + 1))
    && typeof v.colour === "string" && v.colour.length <= 100;
}

export default function MotrVehicleLookup({ initialVrm, onSelect, onCancel }: {
  initialVrm: string;
  onSelect: (vehicle: MotrVehicle) => void;
  onCancel: () => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  // Keep the frame stable while the main form changes.
  const [src] = useState(() => `/vehicle/motr.html?vrm=${encodeURIComponent(initialVrm)}`);
  const [available, setAvailable] = useState(false);
  const [height, setHeight] = useState(186);
  const [failed, setFailed] = useState(false);
  const selecting = useRef(false);
  const selectVehicle = useEffectEvent((vehicle: MotrVehicle) => onSelect(vehicle));

  useEffect(() => {
    const timer = window.setTimeout(() => setFailed(true), 15000);
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const message = event.data;
      if (!message || message.channel !== "coverza-motr") return;
      if (message.type === "state") {
        window.clearTimeout(timer);
        setFailed(false);
        setAvailable(validVehicle(message.vehicle));
        if (typeof message.height === "number" && Number.isFinite(message.height)) {
          setHeight(Math.max(120, Math.min(900, message.height)));
        }
      }
      if (message.type === "selected" && selecting.current) {
        selecting.current = false;
        if (validVehicle(message.vehicle)) selectVehicle(message.vehicle);
        else setAvailable(false);
      }
    }
    window.addEventListener("message", receive);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("message", receive);
    };
  }, []);

  return (
    <section aria-label="MotR vehicle search" className="w-full min-w-0">
      <iframe ref={frame} src={src} title="Search vehicle details with MotR"
        className="block w-full border-0" style={{ height }}
        sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer" />
      {failed ? <p role="status" className="my-2 text-sm">MotR could not load. You can enter your vehicle details manually.</p> : null}
      <div className="flex flex-wrap gap-3">
        {available ? <button type="button" className="w-full rounded-full bg-[rgb(108,76,243)] px-5 py-3 !text-white text-base font-semibold disabled:opacity-40"
          onClick={() => {
            selecting.current = true;
            // Re-read the visible result in the frame at selection time.
            frame.current?.contentWindow?.postMessage({ channel: "coverza-motr", type: "select" }, window.location.origin);
          }}>Use this vehicle</button> : null}
        <button type="button" className="py-2 text-xs underline underline-offset-4" onClick={onCancel}>Enter details manually</button>
      </div>
    </section>
  );
}


