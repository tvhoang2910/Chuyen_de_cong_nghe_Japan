import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  ArrowDown,
  ArrowUp,
  FileText,
  Image as ImageIcon,
  Trash2,
  Upload,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import MainLayout from "../components/MainLayout";
import { getCurrentSessionRole } from "../api/axiosClient";
import { useExamUploadFlow } from "../hooks/useExamUploadFlow";
import {
  ALLOWED_UPLOAD_CONTENT_TYPES,
  MAX_UPLOAD_PAGES,
} from "../api/examUploadClient";

const uploadFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Tiêu đề phải có ít nhất 3 ký tự.")
    .max(255, "Tiêu đề tối đa 255 ký tự."),
  description: z
    .string()
    .trim()
    .max(2000, "Mô tả tối đa 2000 ký tự.")
    .optional()
    .or(z.literal("")),
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

interface StagedFile {
  id: string;
  file: File;
  previewUrl: string;
}

const createStagedFile = (file: File): StagedFile => ({
  id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
  file,
  previewUrl: URL.createObjectURL(file),
});

const UserExamUpload: React.FC = () => {
  const navigate = useNavigate();
  const role = getCurrentSessionRole();
  const Layout = role === "CONTRIBUTOR" || role === "ADMIN" ? AdminLayout : MainLayout;
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const { upload, progress, isUploading } = useExamUploadFlow();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: { title: "", description: "" },
  });

  const acceptAttr = useMemo(
    () => ALLOWED_UPLOAD_CONTENT_TYPES.join(","),
    [],
  );

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const remainingSlots = MAX_UPLOAD_PAGES - stagedFiles.length;
    if (remainingSlots <= 0) {
      toast.error(`Tối đa ${MAX_UPLOAD_PAGES} trang.`);
      return;
    }
    const toAdd = arr.slice(0, remainingSlots).filter((file) => {
      if (
        !(ALLOWED_UPLOAD_CONTENT_TYPES as readonly string[]).includes(file.type)
      ) {
        toast.error(`Định dạng không hỗ trợ: ${file.name}`);
        return false;
      }
      return true;
    });
    if (toAdd.length === 0) return;
    setStagedFiles((prev) => [...prev, ...toAdd.map(createStagedFile)]);
  };

  const removeFile = (id: string) => {
    setStagedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const moveFile = (index: number, direction: -1 | 1) => {
    setStagedFiles((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index]!;
      next[index] = next[target]!;
      next[target] = tmp;
      return next;
    });
  };

  const onSubmit = async (values: UploadFormValues) => {
    if (stagedFiles.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 trang.");
      return;
    }
    const result = await upload({
      title: values.title,
      description: values.description || undefined,
      files: stagedFiles.map((s) => s.file),
    });
    if (result) {
      stagedFiles.forEach((s) => URL.revokeObjectURL(s.previewUrl));
      setStagedFiles([]);
      navigate("/my-uploads");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Upload đề thi</h1>
          <p className="mt-1 text-sm text-slate-600">
            Hỗ trợ ảnh (JPG/PNG/WebP) hoặc PDF, tối đa {MAX_UPLOAD_PAGES} trang.
            Đề sẽ được kiểm duyệt trước khi xuất hiện trên hệ thống.
          </p>
        </header>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="upload-title"
                className="block text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                Tiêu đề đề thi
              </label>
              <input
                id="upload-title"
                type="text"
                autoComplete="off"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                {...register("title")}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="upload-description"
                className="block text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                Mô tả (tuỳ chọn)
              </label>
              <input
                id="upload-description"
                type="text"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                {...register("description")}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragActive(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragActive(true);
            }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragActive(false);
              if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => document.getElementById("upload-files")?.click()}
            className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40"
            }`}
          >
            <Upload className="h-8 w-8 text-blue-500" />
            <p className="text-sm font-semibold text-slate-800">
              Kéo thả hoặc bấm để chọn file
            </p>
            <p className="text-xs text-slate-500">
              Tối đa {MAX_UPLOAD_PAGES} trang · cùng định dạng (ảnh hoặc PDF)
            </p>
            <input
              id="upload-files"
              type="file"
              accept={acceptAttr}
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </button>

          {stagedFiles.length > 0 && (
            <ul className="space-y-2">
              {stagedFiles.map((staged, index) => {
                const prog = progress.find((p) => p.index === index);
                const isImage = staged.file.type.startsWith("image/");
                return (
                  <li
                    key={staged.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                      {isImage ? (
                        <img
                          src={staged.previewUrl}
                          alt={staged.file.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FileText className="h-6 w-6 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        Trang {index + 1} · {staged.file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(staged.file.size / 1024).toFixed(1)} KB ·{" "}
                        {staged.file.type || "không xác định"}
                      </p>
                      {prog && prog.status !== "pending" && (
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full transition-all ${
                              prog.status === "error"
                                ? "bg-rose-500"
                                : prog.status === "done"
                                  ? "bg-emerald-500"
                                  : "bg-blue-500"
                            }`}
                            style={{ width: `${prog.progress}%` }}
                          />
                        </div>
                      )}
                      {prog?.error && (
                        <p className="mt-1 text-xs text-rose-600">
                          {prog.error}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isUploading || index === 0}
                        onClick={() => moveFile(index, -1)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                        aria-label="Di chuyển lên"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={
                          isUploading || index === stagedFiles.length - 1
                        }
                        onClick={() => moveFile(index, 1)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                        aria-label="Di chuyển xuống"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => removeFile(staged.id)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 disabled:opacity-40"
                        aria-label="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">
              {stagedFiles.length}/{MAX_UPLOAD_PAGES} trang đã chọn
            </p>
            <button
              type="submit"
              disabled={isUploading || stagedFiles.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <ImageIcon className="h-4 w-4 animate-pulse" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Gửi duyệt
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default UserExamUpload;
