import React, { useMemo, useRef, useState } from 'react';
import { Pencil, Trash2, Eye, Plus, Save, Megaphone, Archive, FilePlus2, Crown, Lock, CloudUpload, FileText, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import AdminLayout from '../components/AdminLayout';
import { fetchEventSource } from '@microsoft/fetch-event-source'; 
import {
  createGlobalTag,
  createExam,
  deleteExam,
  fetchManagedExamDetail,
  fetchManagedExams,
  fetchGlobalTags,
  uploadExamSource,
  type CreateExamPayload,
  type ExamDetail,
  type ExamQuestion,
  type ExamSummary,
  type OnlineExamStatus,
  type TagOption,
  updateExam,
  updateExamStatus,
} from '../api/examClient';
import { getCurrentSessionRole } from '../api/axiosClient';
import { formatOnlineExamStatus } from '../utils/statusLabels';

type RoleMode = 'ADMIN' | 'CONTRIBUTOR';

type ExamManagementProps = {
  mode: RoleMode;
};

type PanelMode = 'none' | 'create' | 'edit' | 'view' | 'upload-source';

type FormErrors = {
  title?: string;
  maxAttempts?: string;
  teaserQuestionCount?: string;
};

const emptyQuestion = (): ExamQuestion => ({
  content: '',
  explanation: '',
  scoreWeight: 1,
  options: [
    { content: '', isCorrect: true },
    { content: '', isCorrect: false },
    { content: '', isCorrect: false },
    { content: '', isCorrect: false },
  ],
});

const emptyPayload = (): CreateExamPayload => ({
  title: '',
  description: '',
  durationMinutes: 60,
  passingScore: 5,
  maxAttempts: 100,
  premium: false,
  teaserQuestionCount: 2,
  tagIds: [],
  questions: [emptyQuestion()],
});

const ALLOWED_UPLOAD_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
const ALLOWED_UPLOAD_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp';
const ALLOWED_UPLOAD_LABEL = 'PDF, PNG, JPG, WEBP';

const ExamManagementContent: React.FC<{ mode: RoleMode }> = ({ mode }) => {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateExamPayload>(emptyPayload());
  const [panelMode, setPanelMode] = useState<PanelMode>('none');
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<TagOption[]>([]);
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [isTagLoading, setIsTagLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingSource, setIsUploadingSource] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addTagToSelected = (tag: TagOption) => {
    setSelectedTags((prev) => {
      if (prev.some((row) => row.id === tag.id)) {
        return prev;
      }
      return [...prev, tag];
    });
  };

  const handleCreateOrSelectTag = async (rawValue: string) => {
    const candidate = rawValue.trim();
    if (!candidate) {
      return;
    }

    if (selectedTags.some((tag) => tag.name.toLowerCase() === candidate.toLowerCase())) {
      setTagInput('');
      return;
    }

    const existing = availableTags.find((tag) => tag.name.toLowerCase() === candidate.toLowerCase());
    if (existing) {
      addTagToSelected(existing);
      setTagInput('');
      return;
    }

    try {
      const createdTag = await createGlobalTag({ name: candidate });
      addTagToSelected(createdTag);
      setAvailableTags((prev) => {
        if (prev.some((row) => row.id === createdTag.id)) {
          return prev;
        }
        return [createdTag, ...prev];
      });
      toast.success(`Đã tạo tag mới: ${createdTag.name}`);
      setTagInput('');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Không thể tạo tag mới.');
    }
  };

  const handleAddTagByEnter = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') {
      return;
    }

    e.preventDefault();
    await handleCreateOrSelectTag(tagInput);
  };

  const handleRemoveTag = (tagId: number) => {
    setSelectedTags((prev) => prev.filter((tag) => tag.id !== tagId));
  };

  const formSectionRef = useRef<HTMLElement | null>(null);
  const detailSectionRef = useRef<HTMLElement | null>(null);

  const pageTitle = useMemo(() => {
    return mode === 'ADMIN' ? 'Quản lý đề thi hệ thống' : 'Quản lý kho đề của tôi';
  }, [mode]);

  const role = getCurrentSessionRole();

  const loadManagedExams = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const rows = await fetchManagedExams();
      setExams(rows);
    } catch {
      toast.error('Không tải được danh sách đề thi.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadManagedExams();
  }, [loadManagedExams]);

  React.useEffect(() => {
    if (panelMode === 'none') {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPanelMode('none');
      }
    };

    globalThis.addEventListener('keydown', onEscape);
    return () => {
      globalThis.removeEventListener('keydown', onEscape);
    };
  }, [panelMode]);

  React.useEffect(() => {
    if (confirmDeleteId === null) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setConfirmDeleteId(null);
      }
    };

    globalThis.addEventListener('keydown', onEscape);
    return () => {
      globalThis.removeEventListener('keydown', onEscape);
    };
  }, [confirmDeleteId]);

  React.useEffect(() => {
    const token = localStorage.getItem("access_token");
    
    if (!token) {
      console.warn("Chưa có Token, tạm hoãn kết nối SSE.");
      return;
    }

    const ctrl = new AbortController();

    const connectSSE = async () => {
      try {
        const sseUrl = `${import.meta.env.VITE_EXAM_API_BASE_URL || "http://localhost:8082/api/v1/exam"}/sse/events`;

        await fetchEventSource(sseUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal: ctrl.signal,
          async onopen(response) {
            if (response.ok) {
              console.log("Đã kết nối SSE thành công!");
            } else {
              console.error("Lỗi khi kết nối SSE:", response.statusText);
            }
          },
          onmessage(msg) {
            if (msg.event === 'exam') {
              try {
                const data = JSON.parse(msg.data);
                if (data.eventType === "AI_EXTRACTION_SUCCESS") {
                  toast.success(data.message || "Đề thi đã được AI bóc tách xong!");
                  void loadManagedExams();
                } 
                else if (data.eventType === "AI_EXTRACTION_FAILED") {
                  toast.error(data.message || "Lỗi khi AI bóc tách đề thi.");
                }
              } catch (err) {
                console.error("Lỗi parse SSE JSON:", err);
              }
            }
          },
          onclose() {
            console.log("SSE đã đóng kết nối.");
          },
          onerror(err) {
            console.error("SSE Error:", err);
          }
        });
      } catch (err) {
        console.error("Lỗi khi thiết lập SSE:", err);
      }
    };

    void connectSSE();

    return () => {
      ctrl.abort();
    };
  }, [loadManagedExams]);

  React.useEffect(() => {
    if (panelMode !== 'create' && panelMode !== 'edit') {
      return;
    }

    let mounted = true;
    const timer = globalThis.setTimeout(async () => {
      try {
        setIsTagLoading(true);
        const rows = await fetchGlobalTags(tagInput.trim() || undefined);
        if (mounted) {
          setAvailableTags(rows);
        }
      } catch {
        if (mounted) {
          setAvailableTags([]);
        }
      } finally {
        if (mounted) {
          setIsTagLoading(false);
        }
      }
    }, 250);

    return () => {
      mounted = false;
      globalThis.clearTimeout(timer);
    };
  }, [panelMode, tagInput]);

  const openCreate = () => {
    setEditingId(null);
    setSelectedExam(null);
    setForm(emptyPayload());
    setSelectedTags([]);
    setTagInput('');
    setFormErrors({});
    setPanelMode('create');
  };

  const openUploadSource = () => {
    setUploadTitle('');
    setUploadFile(null);
    setPanelMode('upload-source');
  };

  const openEdit = async (examId: number) => {
    try {
      const detail = normalizeExamDetail(await fetchManagedExamDetail(examId));
      setSelectedExam(detail);
      setEditingId(examId);
      setForm({
        title: detail.title,
        description: detail.description || '',
        durationMinutes: detail.durationMinutes,
        passingScore: detail.passingScore,
        maxAttempts: detail.maxAttempts || 100,
        premium: Boolean(detail.premium),
        teaserQuestionCount: detail.teaserQuestionCount || 2,
        tagIds: detail.tags?.map((tag) => tag.id) || [],
        newTags: [],
        questions: detail.questions.map((q) => ({
          id: q.id,
          content: q.content,
          explanation: q.explanation || '',
          scoreWeight: q.scoreWeight,
          options: q.options.map((opt) => ({
            id: opt.id,
            content: opt.content,
            isCorrect: opt.isCorrect,
          })),
        })),
      });
      setSelectedTags(detail.tags || []);
      setTagInput('');
      setFormErrors({});

      requestAnimationFrame(() => {
        formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      setPanelMode('edit');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Không tải được dữ liệu đề thi để chỉnh sửa.');
    }
  };

  const openView = async (examId: number) => {
    try {
      const detail = normalizeExamDetail(await fetchManagedExamDetail(examId));
      setSelectedExam(detail);

      requestAnimationFrame(() => {
        detailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      setPanelMode('view');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Không tải được chi tiết đề thi.');
    }
  };

  const normalizeExamDetail = (detail: ExamDetail): ExamDetail => {
    const questions = Array.isArray(detail.questions) ? detail.questions : [];
    return {
      ...detail,
      questions: questions.map((question) => ({
        ...question,
        options: Array.isArray(question.options) ? question.options : [],
      })),
    };
  };

  const setQuestionCorrectIndex = (questionIndex: number, optionIndex: number) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      next.questions[questionIndex].options = next.questions[questionIndex].options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === optionIndex,
      }));
      return next;
    });
  };

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, emptyQuestion()],
    }));
  };

  const removeQuestion = (index: number) => {
    setForm((prev) => {
      if (prev.questions.length === 1) {
        return prev;
      }
      return {
        ...prev,
        questions: prev.questions.filter((_, idx) => idx !== index),
      };
    });
  };

  const updateQuestionField = (index: number, key: 'content' | 'explanation' | 'scoreWeight', value: string) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      if (key === 'scoreWeight') {
        next.questions[index].scoreWeight = Number(value || 1);
      } else if (key === 'content') {
        next.questions[index].content = value;
      } else {
        next.questions[index].explanation = value;
      }
      return next;
    });
  };

  const updateOptionContent = (questionIndex: number, optionIndex: number, value: string) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      next.questions[questionIndex].options[optionIndex].content = value;
      return next;
    });
  };

  const validatePayload = (payload: CreateExamPayload): string | null => {
    if (!payload.title.trim()) return 'Tiêu đề đề thi không được để trống.';
    if (!payload.maxAttempts || payload.maxAttempts < 1) return 'Số lần làm tối đa phải lớn hơn hoặc bằng 1.';
    if (!payload.teaserQuestionCount || payload.teaserQuestionCount < 1 || payload.teaserQuestionCount > 2) {
      return 'Số câu teaser phải từ 1 đến 2.';
    }
    if (payload.questions.length === 0) return 'Đề thi phải có ít nhất 1 câu hỏi.';

    for (let i = 0; i < payload.questions.length; i += 1) {
      const q = payload.questions[i];
      if (!q.content.trim()) return `Câu hỏi ${i + 1} chưa có nội dung.`;
      if (q.options.length < 2) return `Câu hỏi ${i + 1} phải có ít nhất 2 đáp án.`;
      const filled = q.options.filter((opt) => opt.content.trim()).length;
      if (filled < 2) return `Câu hỏi ${i + 1} cần tối thiểu 2 đáp án có nội dung.`;
      if (!q.options.some((opt) => opt.isCorrect)) return `Câu hỏi ${i + 1} chưa chọn đáp án đúng.`;
    }
    return null;
  };

  const buildFieldErrors = (payload: CreateExamPayload): FormErrors => {
    const errors: FormErrors = {};
    if (!payload.title.trim()) {
      errors.title = 'Tiêu đề đề thi không được để trống.';
    }
    if (!payload.maxAttempts || payload.maxAttempts < 1) {
      errors.maxAttempts = 'Số lần làm tối đa phải lớn hơn hoặc bằng 1.';
    }
    if (!payload.teaserQuestionCount || payload.teaserQuestionCount < 1 || payload.teaserQuestionCount > 2) {
      errors.teaserQuestionCount = 'Số câu teaser phải từ 1 đến 2.';
    }
    return errors;
  };

  const validateAndSetUploadFile = (file: File) => {
    if (file.size > 50 * 1024 * 1024) { 
      toast.error('File quá lớn, vui lòng chọn file dưới 50MB.');
      return;
    }
    const allowedTypes = ALLOWED_UPLOAD_MIME_TYPES as readonly string[];
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Định dạng không hỗ trợ: ${file.name}.`);
      return;
    }
    setUploadFile(file);
  };

  const handleSourceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetUploadFile(e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSourceDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetUploadFile(e.dataTransfer.files[0]);
    }
  };

  const submitUploadSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề đề thi.');
      return;
    }
    if (!uploadFile) {
      toast.error('Vui lòng chọn hoặc kéo thả file.');
      return;
    }

    try {
      setIsUploadingSource(true);
      await uploadExamSource(uploadTitle, uploadFile);
      toast.success('Đã tải file lên thành công! Đề thi đang được AI xử lý.');
      setPanelMode('none');
      await loadManagedExams();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Không thể upload file.');
    } finally {
      setIsUploadingSource(false);
    }
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextFieldErrors = buildFieldErrors(form);
    setFormErrors(nextFieldErrors);
    const firstFieldError = Object.values(nextFieldErrors).find(Boolean);
    if (firstFieldError) {
      toast.error(firstFieldError);
      return;
    }

    const validationMessage = validatePayload(form);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const payload: CreateExamPayload = {
      ...form,
      title: form.title.trim(),
      description: form.description?.trim() || '',
      teaserQuestionCount: Math.max(1, Math.min(2, form.teaserQuestionCount || 2)),
      tagIds: selectedTags.map((tag) => tag.id),
      newTags: [],
      questions: form.questions.map((q) => ({
        ...q,
        content: q.content.trim(),
        explanation: q.explanation?.trim() || '',
        options: q.options.map((opt) => ({
          content: opt.content.trim(),
          isCorrect: opt.isCorrect,
        })),
      })),
    };

    try {
      setIsSaving(true);
      let saved: ExamDetail;
      if (editingId) {
        saved = normalizeExamDetail(await updateExam(editingId, payload));
        toast.success('Đã cập nhật đề thi.');
      } else {
        saved = normalizeExamDetail(await createExam(payload));
        toast.success('Đã tạo đề thi mới.');
      }
      setSelectedExam(saved);
      setEditingId(null);
      setForm(emptyPayload());
      setFormErrors({});
      setPanelMode('none');
      await loadManagedExams();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Không lưu được đề thi.');
    } finally {
      setIsSaving(false);
    }
  };

  const requestDelete = (examId: number) => {
    setConfirmDeleteId(examId);
  };

  const handleDelete = async (examId: number) => {
    try {
      await deleteExam(examId);
      toast.success('Đã xóa đề thi.');
      setConfirmDeleteId(null);
      if (editingId === examId) {
        setEditingId(null);
        setForm(emptyPayload());
      }
      if (selectedExam?.id === examId) {
        setSelectedExam(null);
      }
      if (editingId === examId) {
        setPanelMode('none');
      }
      await loadManagedExams();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Không thể xóa đề thi.');
    }
  };

  const handleStatus = async (examId: number, status: OnlineExamStatus) => {
    try {
      await updateExamStatus(examId, status);
      toast.success('Đã cập nhật trạng thái đề thi.');
      await loadManagedExams();
      if (selectedExam?.id === examId) {
        const detail = normalizeExamDetail(await fetchManagedExamDetail(examId));
        setSelectedExam(detail);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Không cập nhật được trạng thái đề thi.');
    }
  };

  const containerClass = 'space-y-6';
  const primaryActionButtonClass = 'inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 shadow-sm';
  const panelTitleId = panelMode === 'view'
    ? 'exam-management-view-title'
    : panelMode === 'upload-source'
      ? 'exam-management-upload-title'
      : 'exam-management-form-title';

  return (
    <div className={containerClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
          <p className="text-slate-500 mt-1">
            {mode === 'ADMIN' ? 'Đầy đủ chức năng thêm, sửa, xóa, xem và publish/archive toàn bộ đề thi hệ thống.' : 'Quản lý kho đề thi do bạn biên soạn. Thêm mới, chỉnh sửa hoặc dùng AI hỗ trợ tách đề PDF.'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={openUploadSource}
            className={primaryActionButtonClass}
          >
            <CloudUpload className="w-4 h-4" />
            AI Bóc Tách Đề
          </button>
          
          <button
            type="button"
            onClick={openCreate}
            className={primaryActionButtonClass}
          >
            <FilePlus2 className="w-4 h-4" />
            Tạo thủ công
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <section className="xl:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Danh sách đề thi</h2>
            <span className="text-sm font-semibold text-slate-500">{exams.length} đề thi</span>
          </div>

          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {isLoading && <p className="text-slate-500">Đang tải...</p>}
            {!isLoading && exams.length === 0 && (
              <div className="rounded-xl bg-slate-50 p-5 text-slate-500">
                <p>Chưa có đề thi nào.</p>
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <FilePlus2 className="w-4 h-4" /> Tạo đề thi đầu tiên
                </button>
              </div>
            )}
            {!isLoading && exams.map((exam) => (
              <div key={exam.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">{exam.title}</h3>
                      {exam.premium && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                          <Crown className="h-3.5 w-3.5" /> Premium
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2">{exam.description || 'Không có mô tả'}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {exam.totalQuestions} câu hỏi • {exam.durationMinutes} phút • Điểm đỗ {exam.passingScore} • Tối đa {exam.maxAttempts} lượt
                    </p>
                    {exam.premium && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                        <Lock className="h-3.5 w-3.5" /> Xem thử {exam.teaserQuestionCount} câu cho user miễn phí
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    exam.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                    exam.status === 'ARCHIVED' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>{formatOnlineExamStatus(exam.status)}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void openView(exam.id)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                    <Eye className="w-3.5 h-3.5 inline mr-1" />Xem
                  </button>
                  {exam.status !== 'ARCHIVED' && (
                    <button type="button" onClick={() => void openEdit(exam.id)} className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200">
                      <Pencil className="w-3.5 h-3.5 inline mr-1" />Sửa
                    </button>
                  )}
                  {exam.status !== 'ARCHIVED' && (
                    <button type="button" onClick={() => requestDelete(exam.id)} className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200">
                      <Trash2 className="w-3.5 h-3.5 inline mr-1" />Xóa
                    </button>
                  )}
                  {exam.status === 'DRAFT' && (
                    <button type="button" onClick={() => void handleStatus(exam.id, 'PUBLISHED')} className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200">
                      <Megaphone className="w-3.5 h-3.5 inline mr-1" />Public
                    </button>
                  )}
                  {exam.status === 'PUBLISHED' && (
                    <button type="button" onClick={() => void handleStatus(exam.id, 'ARCHIVED')} className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200">
                      <Archive className="w-3.5 h-3.5 inline mr-1" />Archive
                    </button>
                  )}
                  {exam.status === 'ARCHIVED' && (
                    <button type="button" onClick={() => void handleStatus(exam.id, 'PUBLISHED')} className="rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-200">
                      <Megaphone className="w-3.5 h-3.5 inline mr-1" />Khôi phục
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {panelMode !== 'none' && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm px-4 py-8"
            onClick={() => setPanelMode('none')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            <div className="mx-auto h-full max-w-6xl">
              <motion.div
                className="h-full rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden origin-top"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={panelTitleId}
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 12 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
              {panelMode === 'view' ? (
                <section ref={detailSectionRef} className="h-full flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h2 id="exam-management-view-title" className="text-xl font-bold text-slate-900">Chi tiết đề thi</h2>
                    <button
                      type="button"
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                      onClick={() => setPanelMode('none')}
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                    {!selectedExam && <p className="text-slate-500">Không có dữ liệu đề thi để hiển thị.</p>}
                    {selectedExam && (
                      <div className="space-y-4">
                        <div className="rounded-xl bg-slate-50 p-4">
                          <h3 className="text-lg font-bold text-slate-900">{selectedExam.title}</h3>
                          <p className="text-slate-600 mt-1">{selectedExam.description || 'Không có mô tả'}</p>
                          <p className="text-sm text-slate-500 mt-2">
                            Trạng thái: {formatOnlineExamStatus(selectedExam.status)} • {selectedExam.totalQuestions} câu hỏi • Tối đa {selectedExam.maxAttempts} lượt
                          </p>
                          {selectedExam.premium && (
                            <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
                              <Crown className="h-4 w-4" />
                              Đề Premium • User miễn phí xem thử {selectedExam.teaserQuestionCount} câu
                            </p>
                          )}
                          {selectedExam.tags && selectedExam.tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {selectedExam.tags.map((tag, idx) => (
                                <span key={idx} className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700">
                                  #{tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          {selectedExam.questions.map((question, questionIndex) => (
                            <div key={question.id || `q-${questionIndex}`} className="rounded-xl border border-slate-200 p-4">
                              <h4 className="font-semibold text-slate-900">Câu {questionIndex + 1}: {question.content}</h4>
                              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                                {question.options.map((option, optionIndex) => (
                                  <li key={option.id || `opt-${optionIndex}`} className={option.isCorrect ? 'font-semibold text-emerald-700' : ''}>
                                    {optionIndex + 1}. {option.content} {option.isCorrect ? '(Đúng)' : ''}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              ) : panelMode === 'upload-source' ? (
                <section className="h-full flex flex-col bg-slate-50/50">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm z-10">
                    <div className="flex items-center gap-2">
                      <div className="bg-violet-100 p-2 rounded-lg text-violet-600">
                        <CloudUpload className="w-5 h-5" />
                      </div>
                      <h2 id="exam-management-upload-title" className="text-xl font-bold text-slate-900">Upload File Đề Thi AI</h2>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                      onClick={() => setPanelMode('none')}
                    >
                      Đóng
                    </button>
                  </div>

                  <form onSubmit={submitUploadSource} className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl mx-auto w-full">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                          Tiêu đề đề thi <span className="text-rose-500">*</span>
                        </label>
                        <input
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-shadow outline-none"
                          placeholder="VD: Đề thi thử THPT Quốc Gia môn Toán 2026"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                          File đính kèm ({ALLOWED_UPLOAD_LABEL}) <span className="text-rose-500">*</span>
                        </label>
                        
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleSourceDrop}
                          onClick={() => fileInputRef.current?.click()}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              fileInputRef.current?.click();
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label="Chọn file đề thi để tải lên"
                          className={`relative flex flex-col items-center justify-center w-full p-10 mt-2 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                            isDragging 
                              ? 'border-violet-500 bg-violet-50 scale-[1.02]' 
                              : uploadFile 
                                ? 'border-emerald-400 bg-emerald-50/50' 
                                : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                          }`}
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden" 
                            onChange={handleSourceFileSelect}
                            accept={ALLOWED_UPLOAD_ACCEPT}
                          />
                          
                          {uploadFile ? (
                            <div className="flex flex-col items-center text-center">
                              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full mb-3">
                                <FileText className="w-8 h-8" />
                              </div>
                              <p className="text-sm font-semibold text-slate-800 break-all px-4">{uploadFile.name}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                                className="mt-4 flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm"
                              >
                                <X className="w-3 h-3" /> Bỏ chọn file
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-center">
                              <div className="bg-white text-slate-400 p-3 rounded-full mb-3 shadow-sm border border-slate-100">
                                <CloudUpload className="w-8 h-8" />
                              </div>
                              <p className="text-sm font-semibold text-slate-700">
                                Kéo thả file vào đây hoặc <span className="text-violet-600">tải lên từ máy</span>
                              </p>
                              <p className="text-xs text-slate-500 mt-2">
                                Hỗ trợ {ALLOWED_UPLOAD_LABEL} (Tối đa 50MB)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setPanelMode('none')}
                        className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isUploadingSource || !uploadTitle.trim() || !uploadFile}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 font-bold text-white shadow-sm shadow-violet-200 hover:bg-violet-700 disabled:bg-violet-400 transition-all"
                      >
                        {isUploadingSource ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Đang upload...
                          </>
                        ) : (
                          <>
                            <CloudUpload className="w-4 h-4" /> Bắt đầu Upload
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </section>

              ) : (
                <section ref={formSectionRef} className="h-full flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h2 id="exam-management-form-title" className="text-xl font-bold text-slate-900">
                      {panelMode === 'edit' ? 'Cập nhật đề thi' : 'Tạo đề thi mới'}
                    </h2>
                    <button
                      type="button"
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                      onClick={() => setPanelMode('none')}
                    >
                      Đóng
                    </button>
                  </div>

                  <form onSubmit={submitForm} className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Tiêu đề</label>
                      <input
                        value={form.title}
                        onChange={(event) => {
                          setForm((prev) => ({ ...prev, title: event.target.value }));
                          if (formErrors.title) {
                            setFormErrors((prev) => ({ ...prev, title: undefined }));
                          }
                        }}
                        className={`w-full rounded-xl border px-3 py-2 ${formErrors.title ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'}`}
                        aria-invalid={Boolean(formErrors.title)}
                        aria-describedby={formErrors.title ? 'exam-form-title-error' : undefined}
                        placeholder="VD: Đề thi Java Core"
                      />
                      {formErrors.title && (
                        <p id="exam-form-title-error" className="mt-1 text-xs font-semibold text-rose-600">{formErrors.title}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Từ khóa (Tags)</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedTags.map((tag) => (
                          <span key={tag.id} className="inline-flex items-center gap-1 rounded-lg bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
                            {tag.name}
                            <button 
                              type="button" 
                              onClick={() => handleRemoveTag(tag.id)} 
                              className="text-cyan-600 hover:text-rose-600 ml-1 text-base leading-none focus:outline-none"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => void handleAddTagByEnter(e)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Tìm tag có sẵn hoặc gõ tên mới rồi Enter"
                      />
                      <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                        {isTagLoading && <p className="px-3 py-2 text-xs text-slate-500">Đang tìm tag...</p>}
                        {!isTagLoading && availableTags.length === 0 && (
                          <p className="px-3 py-2 text-xs text-slate-500">Không có tag phù hợp.</p>
                        )}
                        {!isTagLoading && availableTags.filter((tag) => !selectedTags.some((selected) => selected.id === tag.id)).map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => addTagToSelected(tag)}
                            className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả</label>
                      <textarea
                        value={form.description}
                        onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Thời gian (phút)</label>
                        <input
                          type="number"
                          value={form.durationMinutes}
                          onChange={(event) => setForm((prev) => ({ ...prev, durationMinutes: Number(event.target.value || 0) }))}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Điểm đỗ</label>
                        <input
                          type="number"
                          value={form.passingScore}
                          onChange={(event) => setForm((prev) => ({ ...prev, passingScore: Number(event.target.value || 0) }))}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                          min={0}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Số lần làm tối đa</label>
                        <input
                          type="number"
                          value={form.maxAttempts}
                          onChange={(event) => {
                            setForm((prev) => ({ ...prev, maxAttempts: Number(event.target.value || 1) }));
                            if (formErrors.maxAttempts) {
                              setFormErrors((prev) => ({ ...prev, maxAttempts: undefined }));
                            }
                          }}
                          className={`w-full rounded-xl border px-3 py-2 ${formErrors.maxAttempts ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'}`}
                          aria-invalid={Boolean(formErrors.maxAttempts)}
                          aria-describedby={formErrors.maxAttempts ? 'exam-form-max-attempts-error' : undefined}
                          min={1}
                        />
                        {formErrors.maxAttempts && (
                          <p id="exam-form-max-attempts-error" className="mt-1 text-xs font-semibold text-rose-600">{formErrors.maxAttempts}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {/* Chỉ Admin mới được đánh dấu đề là Premium */}
                      {mode === 'ADMIN' && (
                        <label className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                          <input
                            type="checkbox"
                            checked={form.premium}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                premium: event.target.checked,
                              }))
                            }
                          />
                          <span className="text-sm font-semibold text-amber-800">Đề này là nội dung Premium</span>
                        </label>
                      )}

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">Số câu teaser cho user miễn phí</label>
                        <input
                          type="number"
                          value={form.teaserQuestionCount}
                          onChange={(event) =>
                            {
                              setForm((prev) => ({
                                ...prev,
                                teaserQuestionCount: Number(event.target.value || 2),
                              }));
                              if (formErrors.teaserQuestionCount) {
                                setFormErrors((prev) => ({ ...prev, teaserQuestionCount: undefined }));
                              }
                            }
                          }
                          className={`w-full rounded-xl border px-3 py-2 ${formErrors.teaserQuestionCount ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'}`}
                          aria-invalid={Boolean(formErrors.teaserQuestionCount)}
                          aria-describedby={formErrors.teaserQuestionCount ? 'exam-form-teaser-error' : undefined}
                          min={1}
                          max={2}
                        />
                        {formErrors.teaserQuestionCount && (
                          <p id="exam-form-teaser-error" className="mt-1 text-xs font-semibold text-rose-600">{formErrors.teaserQuestionCount}</p>
                        )}
                      </div>
                    </div>

                    {form.questions.map((question, questionIndex) => (
                      <div key={`question-${questionIndex}`} className="rounded-xl border border-slate-200 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="font-semibold text-slate-800">Câu hỏi {questionIndex + 1}</h4>
                          {form.questions.length > 1 && (
                            <button type="button" className="text-xs font-semibold text-rose-600" onClick={() => removeQuestion(questionIndex)}>
                              Xóa câu
                            </button>
                          )}
                        </div>

                        <textarea
                          value={question.content}
                          onChange={(event) => updateQuestionField(questionIndex, 'content', event.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm mb-2"
                          placeholder="Nội dung câu hỏi"
                          rows={2}
                        />
                        <input
                          value={question.explanation || ''}
                          onChange={(event) => updateQuestionField(questionIndex, 'explanation', event.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm mb-2"
                          placeholder="Giải thích"
                        />
                        <input
                          type="number"
                          value={question.scoreWeight}
                          onChange={(event) => updateQuestionField(questionIndex, 'scoreWeight', event.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm mb-2"
                          min={0.1}
                          step={0.1}
                        />

                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={`opt-${optionIndex}`} className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={Boolean(option.isCorrect)}
                                onChange={() => setQuestionCorrectIndex(questionIndex, optionIndex)}
                                name={`question-correct-${questionIndex}`}
                              />
                              <input
                                value={option.content}
                                onChange={(event) => updateOptionContent(questionIndex, optionIndex, event.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                                placeholder={`Đáp án ${optionIndex + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="sticky bottom-0 bg-white pt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        <Plus className="w-4 h-4" /> Thêm câu hỏi
                      </button>

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
                      >
                        <Save className="w-4 h-4" /> {isSaving ? 'Đang lưu...' : editingId ? 'Lưu cập nhật' : 'Tạo đề thi'}
                      </button>
                    </div>
                  </form>
                </section>
              )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDeleteId !== null && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmDeleteId(null)}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="exam-delete-confirm-title"
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
            >
              <h2 id="exam-delete-confirm-title" className="text-lg font-bold text-slate-900">Xác nhận xóa đề thi</h2>
              <p className="mt-2 text-sm text-slate-600">Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa đề thi đã chọn?</p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmDeleteId !== null) {
                      void handleDelete(confirmDeleteId);
                    }
                  }}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Xóa đề thi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {role !== mode && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
          Phiên đăng nhập hiện tại có role {role || 'UNKNOWN'}.
        </p>
      )}
    </div>
  );
};

const ExamManagement: React.FC<ExamManagementProps> = ({ mode }) => {
  // Thay vì dùng MainLayout, chúng ta dùng AdminLayout cho cả ADMIN và CONTRIBUTOR
  return (
    <AdminLayout>
      <ExamManagementContent mode={mode} />
    </AdminLayout>
  );
};

export default ExamManagement;