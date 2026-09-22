import View from "@/components/documents/views/Impound";
import { documentMetadata } from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Collection documents",
  "Coverza automotive documents, technical guidance and supporting digital resources.",
  "/impound",
);
export default function Page() {
  return <View />;
}
