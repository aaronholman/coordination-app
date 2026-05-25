import { Suspense } from "react";
import { NewFeatureForm } from "./NewFeatureForm";

export default function NewFeaturePage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      <NewFeatureForm />
    </Suspense>
  );
}
