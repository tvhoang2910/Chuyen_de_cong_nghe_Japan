import { useState, type KeyboardEvent } from "react";

interface CommentFormProps {
  submitLabel: string;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  contextText?: string;
}

const CommentForm = ({
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus = false,
  placeholder = "Nhập nội dung comment...",
  contextText,
}: CommentFormProps) => {
  const [content, setContent] = useState("");

  const submitComment = () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }

    onSubmit(trimmedContent);
    setContent("");
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    submitComment();
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submitComment();
      }}
      className="space-y-4"
    >
      {contextText && (
        <p className="text-sm font-medium text-slate-600">{contextText}</p>
      )}
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        rows={4}
        autoFocus={autoFocus}
        onKeyDown={handleTextareaKeyDown}
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
