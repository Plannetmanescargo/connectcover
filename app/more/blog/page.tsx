import Resources from "@/components/documents/Resources";
import { documentMetadata } from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "The Coverza journal",
  "Clear guidance on automotive documents, service scope and useful technical references.",
  "/more/blog",
);
export default function Page() {
  return <Resources blog={true} />;
}
