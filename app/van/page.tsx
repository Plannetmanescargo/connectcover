import ProductPage from "@/components/documents/ProductPage";
import { documentMetadata } from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Van documents",
  "Explore van documents, supporting digital resources and the information needed to agree your service.",
  "/van",
);
export default function Page() {
  return <ProductPage kind="van" />;
}
