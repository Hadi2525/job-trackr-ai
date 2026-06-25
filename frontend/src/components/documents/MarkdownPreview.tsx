import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface Props {
  content: string;
}

export function MarkdownPreview({ content }: Props) {
  return (
    <div className="prose prose-sm max-w-none h-full overflow-y-auto px-6 py-4">
      {content ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {content}
        </ReactMarkdown>
      ) : (
        <p className="text-gray-400 italic">Nothing to preview yet…</p>
      )}
    </div>
  );
}
