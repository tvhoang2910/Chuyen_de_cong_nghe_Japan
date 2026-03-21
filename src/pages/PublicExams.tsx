import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import MainLayout from '../components/MainLayout';
import { fetchPublicExamDetail, fetchPublicExams, type ExamDetail, type ExamSummary } from '../api/examClient';

const PublicExams: React.FC = () => {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadPublicExams = async () => {
    try {
      setIsLoading(true);
      const data = await fetchPublicExams();
      setExams(data);
    } catch {
      toast.error('Không tải được danh sách đề thi công khai.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPublicExams();
  }, []);

  const openDetail = async (examId: number) => {
    try {
      const detail = await fetchPublicExamDetail(examId);
      setSelectedExam(detail);
    } catch {
      toast.error('Không thể tải chi tiết đề thi.');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Kho đề thi công khai</h1>
          <p className="text-slate-500 mt-1">Người dùng có thể xem các đề đã được public bởi contributor/admin.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <section className="xl:col-span-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Danh sách đề</h2>
              <span className="text-sm font-semibold text-slate-500">{exams.length} đề thi</span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {isLoading && <p className="text-slate-500">Đang tải...</p>}
              {!isLoading && exams.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-slate-500">Hiện chưa có đề thi công khai.</p>
              )}

              {!isLoading && exams.map((exam) => (
                <button
                  key={exam.id}
                  type="button"
                  onClick={() => void openDetail(exam.id)}
                  className="w-full text-left rounded-2xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/40"
                >
                  <h3 className="font-bold text-slate-900">{exam.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2 mt-1">{exam.description || 'Không có mô tả'}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {exam.totalQuestions} câu hỏi • {exam.durationMinutes} phút • Điểm đỗ {exam.passingScore}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Chi tiết đề thi</h2>
            {!selectedExam && <p className="text-slate-500">Chọn một đề thi để xem nội dung.</p>}
            {selectedExam && (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                <div className="rounded-xl bg-slate-50 p-4">
                  <h3 className="font-bold text-slate-900">{selectedExam.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{selectedExam.description || 'Không có mô tả'}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {selectedExam.totalQuestions} câu hỏi • {selectedExam.durationMinutes} phút
                  </p>
                </div>

                {selectedExam.questions.map((question, questionIndex) => (
                  <div key={question.id || `q-${questionIndex}`} className="rounded-xl border border-slate-200 p-4">
                    <h4 className="font-semibold text-slate-900">
                      Câu {questionIndex + 1}: {question.content}
                    </h4>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {question.options.map((option, optionIndex) => (
                        <li key={option.id || `o-${optionIndex}`}>{optionIndex + 1}. {option.content}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default PublicExams;
