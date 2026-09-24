import PageShell from "@/components/site/PageShell";
import { FileText, Mail } from "lucide-react";
import styles from "./checkout.module.css";
import PayPalCheckout from "./PayPalCheckout";

export default function CheckoutView(props: { checkoutId: string; orderId: string; clientId: string; mode: string; totalAmountPence: number; applePay: boolean; googlePay: boolean }) {
  return <PageShell hideHero crumbs={[{ label: "Home", href: "/" }, { label: "Secure checkout" }]}>
    <section className={styles.checkout}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>SECURE CHECKOUT</p>
        <h1 className={styles.title}>You’re one step away.</h1>
        <p className={styles.subtitle}>Complete your purchase securely. We’ll take care of the documents.</p>
      </header>
      <div className={styles.layout}>
        <aside className={styles.summary} aria-label="Order summary">
          <div className={styles.documentIcon}><FileText size={24} aria-hidden="true" /></div>
          <h2>Coverza Vehicle Documents</h2>
          <p>Your documents are prepared after payment verification and sent to your email.</p>
          <div className={styles.total}><span>Total to pay</span><strong>£{(props.totalAmountPence / 100).toFixed(2)}<small>GBP</small></strong></div>
          <p className={styles.delivery}><Mail size={15} aria-hidden="true" />Digital documents. Delivered by email.</p>
        </aside>
        <div className={styles.panel}>
          <PayPalCheckout checkoutId={props.checkoutId} orderId={props.orderId} clientId={props.clientId} mode={props.mode}
            amount={(props.totalAmountPence / 100).toFixed(2)} applePay={props.applePay} googlePay={props.googlePay} />
        </div>
      </div>
    </section>
  </PageShell>;
}
