import View from "@/components/documents/views/Car";
import { documentMetadata } from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Car documents",
  "Coverza automotive documents, technical guidance and supporting digital resources.",
  "/car",
);
export default function Page() {
  return <View />;
}
