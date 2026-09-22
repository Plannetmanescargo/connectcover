import View from "@/components/documents/views/FAQ";
import { documentMetadata } from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Document service FAQs",
  "Coverza automotive documents, technical guidance and supporting digital resources.",
  "/more/faq",
);
export default function Page() {
  return <View />;
}
