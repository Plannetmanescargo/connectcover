import ProductPage from "@/components/documents/ProductPage";
import { documentMetadata } from "@/components/documents/Pages";
export const metadata = documentMetadata(
  "Learner resources",
  "Explore learner resources, supporting digital resources and the information needed to agree your service.",
  "/learner",
);
export default function Page() {
  return <ProductPage kind="learner" />;
}
