(function () {
  "use strict";
  // Adapter for MotR's current rendered widget, not an official callback API.
  // Keep its attribution and do not intercept provider requests.
  function normalize(value) { return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
  function text(node) { return node ? node.textContent.trim() : ""; }
  function usable(value) { return value && !/^(?:—|-|unknown|n\/?a|no data)$/i.test(value) && value.length <= 100; }
  function readVehicle(root) {
    const preview = root.querySelector(".motr-w-preview.active");
    const input = root.querySelector(".motr-w-input");
    if (!preview || !input || root.querySelector(".motr-w-load.active")) return null;
    const registration = normalize(text(preview.querySelector(".motr-w-reg")));
    if (!/^[A-Z0-9]{2,8}$/.test(registration) || registration !== normalize(input.value)) return null;
    const fields = {};
    preview.querySelectorAll(".motr-w-vrow").forEach(row => {
      const label = text(row.querySelector(".motr-w-vk")).toLowerCase();
      fields[label] = text(row.querySelector(".motr-w-vv"));
    });
    if (!usable(fields.make) || !usable(fields.model)) return null;
    const year = /^\d{4}$/.test(fields.year || "") && Number(fields.year) >= 1886
      && Number(fields.year) <= new Date().getFullYear() + 1 ? fields.year : "";
    return { registration, make: fields.make, model: fields.model, year,
      colour: usable(fields.colour) ? fields.colour : "" };
  }
  if (typeof module !== "undefined" && module.exports) module.exports = { readVehicle };
  if (typeof document === "undefined") return;
  const root = document.getElementById("motr");
  const shell = document.getElementById("motr-shell") || root;
  const contentHeight = () => Math.ceil(shell.getBoundingClientRect().height) + 8;
  let initialized = false;
  let revision = 0;
  let last = "";
  const send = (type, vehicle) => window.parent.postMessage({ channel: "coverza-motr", type,
    vehicle, height: contentHeight() }, window.location.origin);
  function update() {
    const input = root.querySelector(".motr-w-input");
    if (!input) return;
    if (!initialized) {
      initialized = true;
      input.id = "motr-registration";
      input.value = normalize(new URLSearchParams(location.search).get("vrm")).slice(0, 8);
    }
    const vehicle = readVehicle(root);
    const signature = JSON.stringify([vehicle, contentHeight(), revision]);
    if (signature !== last) { last = signature; send("state", vehicle); }
  }
  // Invalidate immediately when starting another lookup; old results must never
  // be selected while a request is pending or after New search is clicked.
  function invalidate() {
    const preview = root.querySelector(".motr-w-preview");
    if (preview) preview.classList.remove("active");
    revision++;
    send("state", null);
  }
  root.addEventListener("input", invalidate, true);
  root.addEventListener("submit", invalidate, true);
  root.addEventListener("click", event => {
    if (event.target instanceof Element && event.target.closest(".motr-w-back")) invalidate();
  }, true);
  new MutationObserver(update).observe(root, { childList: true, subtree: true,
    attributes: true, characterData: true });
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(update).observe(shell);
  window.addEventListener("resize", update);
  window.addEventListener("message", event => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    if (event.data?.channel === "coverza-motr" && event.data.type === "select") {
      send("selected", readVehicle(root));
    }
  });
  update();
})();

