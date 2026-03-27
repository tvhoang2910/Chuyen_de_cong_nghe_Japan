import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../components/MainLayout';
import { fetchAttemptResult, type AttemptResult } from '../api/examClient';

const ExamResult: React.FC = () => {
  const params = useParams();
  const attemptId = Number(params.attemptId || 0);

  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId || Number.isNaN(attemptId)) {
      toast.error('Attempt ID không hợp lệ.');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchAttemptResult(attemptId);
        setResult(data);
      } catch {
        toast.error('Không tải được kết quả bài thi.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [attemptId]);

  if (loading) {
    return (
      <MainLayout>
        <p className="text-slate-500">Đang tải kết quả...</p>
      </MainLayout>
    );
  }

  if (!result) {
    return (
      <MainLayout>
        <p className="text-slate-500">Không có dữ liệu kết quả.</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-5">
          <h1 className="text-2xl font-bold text-slate-900">Kết quả: {result.examTitle}</h1>
          <p className="mt-2 text-slate-600">
            Điểm: <span className="font-semibold">{result.scoreRaw}/{result.scoreMax}</span> ({result.scorePercent}%)
          </p>
          <p className={`mt-1 font-semibold ${result.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
            {result.passed ? 'Đạt' : 'Chưa đạt'} (mốc đỗ: {result.passingScore})
          </p>
          <p className="text-xs text-slate-500 mt-1">Trạng thái: {result.status}</p>
          <Link to="/dashboard/exams" className="inline-block mt-3 text-sm font-semibold text-blue-700 hover:text-blue-800">
            ← Quay lại kho đề
          </Link>
        </header>

        <section className="space-y-3">
          {result.questionResults.map((question, idx) => (
            <article key={question.questionId} className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="font-semibold text-slate-900">Câu {idx + 1}: {question.content}</h2>
              <p className="text-sm mt-2 text-slate-600">
                Điểm: {question.earnedScore}/{question.maxScore} • {question.correct ? 'Đúng' : 'Sai'}
              </p>
              <p className="text-xs mt-1 text-slate-500">
                Đáp án chọn: {question.selectedOptionIds.length > 0
                  ? question.selectedOptionIds
                      .map((optionId) => question.options.find((option) => option.id === optionId)?.content || `#${optionId}`)
                      .join(', ')
                  : 'Bỏ trống'}
              </p>
              <p className="text-xs mt-1 text-slate-500">
                Đáp án đúng: {question.correctOptionIds
                  .map((optionId) => question.options.find((option) => option.id === optionId)?.content || `#${optionId}`)
                  .join(', ')}
              </p>
            </article>
          ))}
        </section>
      </div>
    </MainLayout>
  );
};

export default ExamResult;
