import LegalPage from "@/components/documents/LegalPage";
import { documentMetadata } from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Document service privacy",
  "Review draft of the document-service privacy, with existing service information retained separately.",
  "/privacy",
);
export default function Page() {
  return <LegalPage kind="privacy" />;
}
