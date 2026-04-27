import dynamic from "next/dynamic";

export interface RichTextEditorProps {
  initialContent: string;
  onSave: (content: string) => void | Promise<void>;
  placeholder?: string;
}
const RichTextEditorClient = dynamic(
  () => import("./RichTextEditorClient").then((mod) => mod.RichTextEditorClient),
  { ssr: false },
);

export function RichTextEditor(props: RichTextEditorProps) {
  return <RichTextEditorClient {...props} />;
}
