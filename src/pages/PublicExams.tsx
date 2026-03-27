import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../components/MainLayout';
import { fetchPublicExams, type ExamSummary } from '../api/examClient';

const PublicExams: React.FC = () => {
  const [exams, setExams] = useState<ExamSummary[]>([]);
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Kho đề thi công khai</h1>
          <p className="text-slate-500 mt-1">Người dùng có thể xem các đề đã được public bởi contributor/admin.</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
                <article
                  key={exam.id}
                  className="w-full rounded-2xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/40"
                >
                  <h3 className="font-bold text-slate-900">{exam.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2 mt-1">{exam.description || 'Không có mô tả'}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {exam.totalQuestions} câu hỏi • {exam.durationMinutes} phút • Điểm đỗ {exam.passingScore}
                  </p>
                  {exam.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {exam.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3">
                    <Link
                      to={`/dashboard/exams/${exam.id}`}
                      className="inline-flex rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Xem đề
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default PublicExams;
