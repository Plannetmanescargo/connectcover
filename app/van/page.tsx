import View from "@/components/documents/views/Van";
import { documentMetadata } from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Van documents",
  "Coverza automotive documents, technical guidance and supporting digital resources.",
  "/van",
);
export default function Page() {
  return <View />;
}
