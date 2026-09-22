import View from "@/components/documents/views/Contact";
import { documentMetadata } from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Contact documents",
  "Coverza automotive documents, technical guidance and supporting digital resources.",
  "/contact",
);
export default function Page() {
  return <View />;
}
