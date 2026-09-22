import View from "@/components/documents/views/Blog";
import { documentMetadata } from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Blog documents",
  "Coverza automotive documents, technical guidance and supporting digital resources.",
  "/more/blog",
);
export default function Page() {
  return <View />;
}
