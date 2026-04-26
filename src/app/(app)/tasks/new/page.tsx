import { Suspense } from "react";
import { NewTaskForm } from "./NewTaskForm";

export default function NewTaskPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      <NewTaskForm />
    </Suspense>
  );
}
