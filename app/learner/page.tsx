import View from "@/components/documents/views/Learner";
import { documentMetadata } from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Learner documents",
  "Coverza automotive documents, technical guidance and supporting digital resources.",
  "/learner",
);
export default function Page() {
  return <View />;
}
