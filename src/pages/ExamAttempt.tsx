import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import PremiumUpsellModal from '../components/PremiumUpsellModal';
import {
  fetchAttemptView,
  isPremiumUpgradeRequiredError,
  saveAttemptAnswersBatch,
  startAttempt,
  submitAttempt,
  type ApiErrorResponse,
  type ExamDetail,
  type SaveAttemptAnswerPayload,
} from '../api/examClient';

type QuestionState = {
  firstSeenAt: number;
  changeCount: number;
};

const ANSWER_SYNC_DEBOUNCE_MS = 700;
const ANSWER_SYNC_INTERVAL_MS = 5000;

const ExamAttempt: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const examId = Number(params.examId || 0);

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [timerInitialized, setTimerInitialized] = useState(false);

  const questionMetaRef = useRef<Record<number, QuestionState>>({});
  const initializedExamIdRef = useRef<number | null>(null);
  const pendingAnswersRef = useRef<Record<number, SaveAttemptAnswerPayload>>({});
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlushingRef = useRef(false);

  const flushPendingAnswers = useCallback(async () => {
    if (!attemptId || isFlushingRef.current) {
      return;
    }

    const pendingAnswers = Object.values(pendingAnswersRef.current);
    if (pendingAnswers.length === 0) {
      return;
    }

    pendingAnswersRef.current = {};
    isFlushingRef.current = true;

    try {
      await saveAttemptAnswersBatch(attemptId, { answers: pendingAnswers });
    } catch {
      for (const answer of pendingAnswers) {
        pendingAnswersRef.current[answer.questionId] = answer;
      }
      toast.error('Không thể đồng bộ đáp án ngay lúc này, hệ thống sẽ tự thử lại.', {
        id: 'attempt-sync-error',
      });
    } finally {
      isFlushingRef.current = false;
    }
  }, [attemptId]);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current !== null) {
      globalThis.clearTimeout(flushTimerRef.current);
    }

    flushTimerRef.current = globalThis.setTimeout(() => {
      flushTimerRef.current = null;
      void flushPendingAnswers();
    }, ANSWER_SYNC_DEBOUNCE_MS);
  }, [flushPendingAnswers]);

  useEffect(() => {
    if (!examId || Number.isNaN(examId)) {
      toast.error('Exam ID không hợp lệ.');
      navigate('/dashboard/exams');
      return;
    }

    if (initializedExamIdRef.current === examId) {
      return;
    }
    initializedExamIdRef.current = examId;

    const load = async () => {
      try {
        setLoading(true);
        const examDetail = await fetchAttemptView(examId);
        setExam(examDetail);

        if (examDetail.premiumLocked) {
          setShowPremiumModal(true);
          return;
        }

        const started = await startAttempt({ examId, clientVersion: 'exam-web-1.0.0' });
        setAttemptId(started.attemptId);
        setExpiresAt(started.expiresAt);
      } catch (error) {
        const status = axios.isAxiosError<ApiErrorResponse>(error)
          ? error.response?.status
          : undefined;
        const message = axios.isAxiosError<ApiErrorResponse>(error)
          ? error.response?.data?.message || 'Không thể bắt đầu bài thi.'
          : 'Không thể bắt đầu bài thi.';

        if (isPremiumUpgradeRequiredError(status, message)) {
          setShowPremiumModal(true);
          toast.error(message, { id: 'start-attempt-error' });
          return;
        }

        toast.error(message, { id: 'start-attempt-error' });
        navigate('/dashboard/exams');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [examId, navigate]);

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const updateTimer = () => {
      const nowMs = Date.now();
      const expiresMs = new Date(expiresAt).getTime();
      const deltaSeconds = Math.max(0, Math.floor((expiresMs - nowMs) / 1000));
      setRemainingSeconds(deltaSeconds);
    };

    updateTimer();
    setTimerInitialized(true);
    const interval = globalThis.setInterval(updateTimer, 1000);
    return () => {
      globalThis.clearInterval(interval);
      setTimerInitialized(false);
    };
  }, [expiresAt]);

  useEffect(() => {
    if (!timerInitialized || remainingSeconds !== 0 || !attemptId || submitting) {
      return;
    }

    const autoSubmit = async () => {
      try {
        setSubmitting(true);
        await flushPendingAnswers();
        const result = await submitAttempt(attemptId);
        toast.success('Hết giờ, hệ thống đã tự nộp bài.');
        navigate(`/dashboard/attempts/${result.attemptId}/result`);
      } catch {
        toast.error('Không thể tự nộp bài. Vui lòng thử lại.');
      } finally {
        setSubmitting(false);
      }
    };

    void autoSubmit();
  }, [attemptId, flushPendingAnswers, navigate, remainingSeconds, submitting, timerInitialized]);

  useEffect(() => {
    if (!attemptId || submitting) {
      return;
    }

    const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    globalThis.addEventListener('beforeunload', beforeUnloadHandler);
    return () => {
      globalThis.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }, [attemptId, submitting]);

  useEffect(() => {
    if (!attemptId) {
      return;
    }

    const interval = globalThis.setInterval(() => {
      if (!submitting) {
        void flushPendingAnswers();
      }
    }, ANSWER_SYNC_INTERVAL_MS);

    return () => {
      globalThis.clearInterval(interval);
    };
  }, [attemptId, submitting, flushPendingAnswers]);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current !== null) {
        globalThis.clearTimeout(flushTimerRef.current);
      }
    };
  }, []);

  const totalQuestions = useMemo(() => exam?.questions.length || 0, [exam?.questions.length]);
  const isPreviewMode = Boolean(exam?.premiumLocked) || (Boolean(exam?.premium) && !attemptId);

  const handleChooseOption = (questionId: number, optionId: number) => {
    if (!attemptId || isPreviewMode) {
      return;
    }

    const now = Date.now();
    const currentMeta = questionMetaRef.current[questionId];
    const nextMeta: QuestionState = currentMeta
      ? {
          firstSeenAt: currentMeta.firstSeenAt,
          changeCount: currentMeta.changeCount + 1,
        }
      : {
          firstSeenAt: now,
          changeCount: 0,
        };

    questionMetaRef.current[questionId] = nextMeta;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: [optionId],
    }));

    pendingAnswersRef.current[questionId] = {
      questionId,
      selectedOptionIds: [optionId],
      responseTimeMs: now - nextMeta.firstSeenAt,
      answerChangeCount: nextMeta.changeCount,
    };
    scheduleFlush();
  };

  const handleSubmit = async () => {
    if (!attemptId) {
      return;
    }

    try {
      setSubmitting(true);
      await flushPendingAnswers();
      const result = await submitAttempt(attemptId);
      toast.success('Nộp bài thành công.');
      navigate(`/dashboard/attempts/${result.attemptId}/result`);
    } catch {
      toast.error('Nộp bài thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Đang tải bài thi...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Không tìm thấy bài thi.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
            <p className="text-slate-500 text-sm mt-1">{totalQuestions} câu hỏi • Điểm đỗ {exam.passingScore}</p>
          </div>
          {attemptId ? (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-rose-700 font-semibold">
              Thời gian còn lại: {formatTimer(remainingSeconds)}
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800 font-semibold">
              Chế độ xem thử Premium
            </div>
          )}
        </div>

        {isPreviewMode && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Bạn đang xem thử nội dung Premium</p>
            <p className="mt-1">
              Để bắt đầu làm bài, lưu đáp án và nộp kết quả, vui lòng nâng cấp Premium.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {exam.questions.map((question, qIndex) => (
            <section key={question.id || qIndex} className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="font-semibold text-slate-900">Câu {qIndex + 1}: {question.content}</h2>
              <div className="mt-3 space-y-2">
                {question.options.map((opt, optIndex) => {
                  const selectedOptionId = answers[question.id || 0]?.[0];
                  const active = selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id || optIndex}
                      type="button"
                      disabled={isPreviewMode || !question.id || !opt.id}
                      onClick={() => question.id && opt.id && handleChooseOption(question.id, opt.id)}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                        active
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : isPreviewMode
                            ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                            : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700'
                      }`}
                    >
                      {optIndex + 1}. {opt.content}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {isPreviewMode ? (
          <div className="sticky bottom-3 flex justify-end">
            <button
              type="button"
              onClick={() => setShowPremiumModal(true)}
              className="rounded-xl bg-amber-500 px-5 py-2.5 font-semibold text-white hover:bg-amber-600"
            >
              Nâng cấp Premium để làm bài
            </button>
          </div>
        ) : (
          <div className="sticky bottom-3 flex justify-end">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
            >
              {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
            </button>
          </div>
        )}
      </div>

      <PremiumUpsellModal
        open={showPremiumModal}
        title="Đề thi này thuộc gói Premium"
        description="Bạn cần nâng cấp Premium để mở toàn bộ câu hỏi, bắt đầu bài thi và nhận kết quả chấm điểm."
        teaserQuestionCount={exam.teaserQuestionCount}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={() => navigate('/dashboard/subscription-payments')}
      />
    </div>
  );
};

export default ExamAttempt;
