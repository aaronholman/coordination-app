import { Suspense } from "react";
import { NewDocumentForm } from "./NewDocumentForm";

export default function NewDocumentPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      <NewDocumentForm />
    </Suspense>
  );
}
