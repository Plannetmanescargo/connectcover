import View from "@/components/documents/views/Help";
import { documentMetadata } from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Help & support",
  "Coverza automotive documents, technical guidance and supporting digital resources.",
  "/help-support",
);
export default function Page() {
  return <View />;
}
