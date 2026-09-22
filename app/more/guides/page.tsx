import Resources from "@/components/documents/Resources";
import { documentMetadata } from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Practical document guides",
  "Clear guidance on automotive documents, service scope and useful technical references.",
  "/more/guides",
);
export default function Page() {
  return <Resources blog={false} />;
}
