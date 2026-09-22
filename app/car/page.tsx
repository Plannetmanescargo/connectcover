import ProductPage from "@/components/documents/ProductPage";
import { documentMetadata } from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Car documents",
  "Explore car documents, supporting digital resources and the information needed to agree your service.",
  "/car",
);
export default function Page() {
  return <ProductPage kind="car" />;
}
