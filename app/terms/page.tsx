import LegalPage from "@/components/documents/LegalPage";
import { documentMetadata } from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Document service terms",
  "Review draft of the document-service terms, with existing service information retained separately.",
  "/terms",
);
export default function Page() {
  return <LegalPage kind="terms" />;
}
