import ProductPage from "@/components/documents/ProductPage";
import { documentMetadata } from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Collection documents",
  "Explore collection documents, supporting digital resources and the information needed to agree your service.",
  "/impound",
);
export default function Page() {
  return <ProductPage kind="impound" />;
}
