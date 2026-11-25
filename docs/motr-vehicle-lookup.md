# MOTR vehicle lookup

The homepage and purchase form use the official MOTR widget loader in
/public/vehicle/motr.html. Its compact styling matches Coverza; attribution
remains visible and the full report link is hidden.

The bridge reads the currently displayed registration, make, model, year and
colour. It invalidates selection on new input/search and rechecks results when
the visitor selects Use this vehicle. Parent messages require the same origin,
the expected frame source and valid vehicle fields.

The homepage saves only selected vehicle fields in sessionStorage under
coverza_motr_vehicle. The purchase form consumes this one-time handoff, checks
that its registration matches the URL and fills the vehicle summary. It does not
carry customer details or dates from the homepage. Manual entry remains available
if the provider or storage is unavailable. The legacy lookup API is unchanged.

The iframe is a layout/lifecycle boundary, not a security boundary: the official
third-party script runs with same-origin access. No provider keys are required.
The bridge depends on MOTR's widget markup, so provider changes may require
maintenance.

Verification: targeted strict TypeScript checks for both new React components;
TSX syntax checks for the updated pages; JSDOM execution of the actual provider
loader with controlled lookup responses checking styling, label association,
content height, vehicle handoff, hidden report link and visible attribution.

After deployment: search BF66EGY from the homepage, select the result and verify
the purchase form shows the vehicle without another lookup. Repeat directly on
/get-quote, change vehicle and check manual entry on mobile and desktop.
No live payment is required to check vehicle selection.
