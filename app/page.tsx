import View from "@/components/documents/views/Home";
import { documentMetadata } from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Vehicle documents, with clarity",
  "Coverza automotive documents, technical guidance and supporting digital resources.",
  "/",
);
export default function Page() {
  return <View />;
}
