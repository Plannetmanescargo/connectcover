# MOTR vehicle lookup

Only /get-quote uses the official MOTR widget loader in /public/vehicle/motr.html. The homepage is unchanged. Compact purple styling matches Coverza, Powered by MOTR remains visible, and the full report link is hidden.

The bridge reads the displayed registration, make, model, year and colour. It invalidates selection on new input/search and rechecks the result on Use this vehicle. Messages require the expected origin, frame source and valid vehicle fields. Selected details fill the purchase form; manual entry and the existing draft restore remain available. The legacy lookup API is unchanged.

The iframe provides layout isolation, not a security boundary: the third-party script has same-origin access. No provider keys are required. The bridge depends on MOTR widget markup.

Validation: targeted component TypeScript checks and page syntax checks; JSDOM execution of the provider loader with controlled results verifying compact styles, accessible label, content height, selected details, hidden report link and visible attribution. Full build and real-browser checks remain for the Vercel preview.

After deployment, search from /get-quote, select the vehicle, check the summary, then test changing vehicle and manual entry on mobile and desktop. No payment is needed to test selection.
