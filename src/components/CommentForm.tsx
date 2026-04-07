import { useState } from "react";

interface CommentFormProps {
  submitLabel: string;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

const CommentForm = ({
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus = false,
}: CommentFormProps) => {
  const [content, setContent] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!content.trim()) return;
        onSubmit(content.trim());
        setContent("");
      }}
      className="space-y-4"
    >
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Nhập nội dung comment..."
        rows={4}
        autoFocus={autoFocus}
        className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Hủy
          </button>
        )}
      </div>
    </form>
  );
};

export default CommentForm;
