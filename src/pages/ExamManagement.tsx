import React, { useMemo, useRef, useState } from 'react';
import { Pencil, Trash2, Eye, Plus, Save, Megaphone, Archive, FilePlus2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import MainLayout from '../components/MainLayout';
import AdminLayout from '../components/AdminLayout';
import {
  createExam,
  deleteExam,
  fetchManagedExamDetail,
  fetchManagedExams,
  type CreateExamPayload,
  type ExamDetail,
  type ExamQuestion,
  type ExamSummary,
  type OnlineExamStatus,
  updateExam,
  updateExamStatus,
} from '../api/examClient';
import { getCurrentSessionRole } from '../api/axiosClient';

type RoleMode = 'ADMIN' | 'CONTRIBUTOR';

type ExamManagementProps = {
  mode: RoleMode;
};

type PanelMode = 'none' | 'create' | 'edit' | 'view';

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
  questions: [emptyQuestion()],
});

const ExamManagementContent: React.FC<{ mode: RoleMode }> = ({ mode }) => {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateExamPayload>(emptyPayload());
  const [panelMode, setPanelMode] = useState<PanelMode>('none');
  const formSectionRef = useRef<HTMLElement | null>(null);
  const detailSectionRef = useRef<HTMLElement | null>(null);

  const pageTitle = useMemo(() => {
    return mode === 'ADMIN' ? 'Quản lí đề thi hệ thống' : 'Quản lí đề thi của tôi';
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

  const openCreate = () => {
    setEditingId(null);
    setSelectedExam(null);
    setForm(emptyPayload());
    setPanelMode('create');
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

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationMessage = validatePayload(form);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const payload: CreateExamPayload = {
      ...form,
      title: form.title.trim(),
      description: form.description?.trim() || '',
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
      setPanelMode('none');
      await loadManagedExams();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Không lưu được đề thi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (examId: number) => {
    if (!globalThis.confirm('Bạn chắc chắn muốn xóa đề thi này?')) {
      return;
    }
    try {
      await deleteExam(examId);
      toast.success('Đã xóa đề thi.');
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
    } catch {
      toast.error('Không thể xóa đề thi.');
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
    } catch {
      toast.error('Không cập nhật được trạng thái đề thi.');
    }
  };

  const containerClass = 'space-y-6';

  return (
    <div className={containerClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
          <p className="text-slate-500 mt-1">Đầy đủ chức năng thêm, sửa, xóa, xem và publish/archive đề thi.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          <FilePlus2 className="w-4 h-4" />
          Tạo đề thi
        </button>
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
              <p className="rounded-xl bg-slate-50 p-4 text-slate-500">Chưa có đề thi nào.</p>
            )}
            {!isLoading && exams.map((exam) => (
              <div key={exam.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900">{exam.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{exam.description || 'Không có mô tả'}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {exam.totalQuestions} câu hỏi • {exam.durationMinutes} phút • Điểm đỗ {exam.passingScore}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{exam.status}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void openView(exam.id)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                    <Eye className="w-3.5 h-3.5 inline mr-1" />Xem
                  </button>
                  <button type="button" onClick={() => void openEdit(exam.id)} className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200">
                    <Pencil className="w-3.5 h-3.5 inline mr-1" />Sửa
                  </button>
                  <button type="button" onClick={() => void handleDelete(exam.id)} className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200">
                    <Trash2 className="w-3.5 h-3.5 inline mr-1" />Xóa
                  </button>
                  <button type="button" onClick={() => void handleStatus(exam.id, 'PUBLISHED')} className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200">
                    <Megaphone className="w-3.5 h-3.5 inline mr-1" />Public
                  </button>
                  <button type="button" onClick={() => void handleStatus(exam.id, 'ARCHIVED')} className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200">
                    <Archive className="w-3.5 h-3.5 inline mr-1" />Archive
                  </button>
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
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 12 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
              {panelMode === 'view' ? (
                <section ref={detailSectionRef} className="h-full flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h2 className="text-xl font-bold text-slate-900">Chi tiết đề thi</h2>
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
                            Trạng thái: {selectedExam.status} • {selectedExam.totalQuestions} câu hỏi
                          </p>
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
              ) : (
                <section ref={formSectionRef} className="h-full flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h2 className="text-xl font-bold text-slate-900">
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
                        onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        placeholder="VD: Đề thi Java Core"
                      />
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
                    <div className="grid grid-cols-2 gap-2">
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
                                checked={option.isCorrect}
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

      {role !== mode && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
          Phiên đăng nhập hiện tại có role {role || 'UNKNOWN'}.
        </p>
      )}
    </div>
  );
};

const ExamManagement: React.FC<ExamManagementProps> = ({ mode }) => {
  if (mode === 'ADMIN') {
    return (
      <AdminLayout>
        <ExamManagementContent mode={mode} />
      </AdminLayout>
    );
  }

  return (
    <MainLayout>
      <ExamManagementContent mode={mode} />
    </MainLayout>
  );
};

export default ExamManagement;
