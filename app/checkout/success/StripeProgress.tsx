import { Check, FileText, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import styles from "../paypal/checkout.module.css";

export default function StripeProgress({ state, documentsReady = false, compact = false, delayed = false }: {
  state: string; documentsReady?: boolean; compact?: boolean; delayed?: boolean;
}) {
  const paid = state === "PAID";
  const current = !paid ? 0 : documentsReady ? 2 : 1;
  const steps = [
    { label: "Confirming payment", detail: "Secure verification with Stripe", icon: LockKeyhole },
    { label: "Preparing your documents", detail: "Creating and saving your files", icon: FileText },
    { label: "Sending your email", detail: "Submitting your documents for delivery", icon: Mail },
  ];
  return <div className={`${styles.progress} ${compact ? styles.compact : ""}`}>
    <div className={styles.progressIcon}><LoaderCircle className={styles.spinner} size={26} aria-hidden="true" /></div>
    <p className={styles.eyebrow}>YOUR COVERZA PURCHASE</p>
    <h1 className={styles.progressTitle}>{paid ? "Payment received." : "One moment. We’re on it."}</h1>
    <p className={styles.progressIntro} role="status" aria-live="polite">{paid ? "We’re getting your vehicle documents ready." : "We’re securely confirming your payment."}</p>
    <ol className={styles.steps} aria-label="Purchase progress">
      {steps.map(({ label, detail, icon: Icon }, index) => <li key={label} className={`${styles.step} ${index === current ? styles.active : index < current ? styles.done : ""}`} aria-current={index === current ? "step" : undefined}>
        <span className={`${styles.stepIcon} ${index < current ? styles.complete : ""}`}>{index < current ? <Check size={17} aria-hidden="true" /> : <Icon size={17} aria-hidden="true" />}</span>
        <span><strong>{label}</strong><small>{detail}</small></span>
        <span className={styles.stepStatus}>{index < current ? "Done" : index === current ? "In progress" : "Next"}</span>
      </li>)}
    </ol>
    <p className={styles.progressFoot}>{delayed ? "This is taking longer than usual. We’re still checking automatically; please don’t make another payment. You can contact support with your checkout reference." : "This page updates automatically. Please don’t refresh or pay again."}</p>
  </div>;
}
