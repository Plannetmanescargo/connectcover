import View from "@/components/documents/views/Guides";
import { documentMetadata } from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Guides documents",
  "Coverza automotive documents, technical guidance and supporting digital resources.",
  "/more/guides",
);
export default function Page() {
  return <View />;
}
