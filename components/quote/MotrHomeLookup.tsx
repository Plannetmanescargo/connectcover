"use client";
import { useState } from "react";
import MotrVehicleLookup from "./MotrVehicleLookup";

export default function MotrHomeLookup() {
  const [error, setError] = useState(false);
  return <div className="mt-7 max-w-md">
    <MotrVehicleLookup initialVrm="" onCancel={() => window.location.assign("/get-quote?manual=1")}
      onSelect={vehicle => {
        try {
          sessionStorage.setItem("coverza_motr_vehicle", JSON.stringify(vehicle));
          window.location.assign("/get-quote?vrm=" + encodeURIComponent(vehicle.registration));
        } catch { setError(true); }
      }} />
    {error && <p role="alert" className="mt-2 text-sm">Your browser could not save the vehicle. <a className="underline" href="/get-quote">Continue to enter your details</a>.</p>}
  </div>;
}
