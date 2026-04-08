import React, { useEffect, useMemo, useRef, useState } from "react";
import { Zap, ChartLine, Clock } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUserProfile, type UserProfile } from "../api/axiosClient";
import { fetchMyAttemptHistory, type AttemptSummary } from "../api/examClient";
import MainLayout from "../components/MainLayout";

const radarData = [
  { subject: "Toán", A: 85 },
  { subject: "Vật lý", A: 70 },
  { subject: "IT", A: 90 },
  { subject: "Tiếng Anh", A: 65 },
  { subject: "Triết học", A: 50 },
  { subject: "Giải phẫu", A: 40 },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<AttemptSummary[]>([]);
  const hasRequestedProfileRef = useRef(false);

  const recentActivities = useMemo(() => {
    return attemptHistory
      .flatMap((attempt) => {
        const startedActivity = {
          id: `start-${attempt.attemptId}`,
          label: `Bắt đầu đề ${attempt.examTitle}`,
          timestamp: attempt.startedAt,
          tone: "text-slate-700",
        };

        const submittedActivity = attempt.submittedAt
          ? {
              id: `submit-${attempt.attemptId}`,
              label: `Đã nộp đề ${attempt.examTitle}`,
              timestamp: attempt.submittedAt,
              tone: "text-emerald-700",
            }
          : null;

        return submittedActivity
          ? [submittedActivity, startedActivity]
          : [startedActivity];
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 6);
  }, [attemptHistory]);

  useEffect(() => {
    if (hasRequestedProfileRef.current) return;
    hasRequestedProfileRef.current = true;

    const loadProfile = async () => {
      try {
        const [profile, history] = await Promise.all([
          fetchCurrentUserProfile(),
          fetchMyAttemptHistory(),
        ]);
        setUser(profile);
        setAttemptHistory(history);
      } catch {
        toast.error("Không thể tải thông tin người dùng.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadProfile();
  }, []);

  const welcomeMessage = user
    ? `Chào buổi sáng, ${user.fullName}! 👋`
    : "Chào buổi sáng! 👋";

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">
              {welcomeMessage}
            </h1>
            <p className="text-slate-500">
              Sẵn sàng chinh phục kiến thức mới hôm nay chưa?
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/exams")}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Xem kho đề thi công khai
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hero Action Widget */}
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-600/20 group">
            <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-lg text-xs font-bold text-white mb-6 backdrop-blur-md border border-white/20 uppercase tracking-widest">
                  <Zap className="w-3.5 h-3.5 fill-white" /> Thuật toán SM-2
                </div>
                <h2 className="text-4xl font-bold mb-4 leading-tight">
                  Bạn có 24 câu hỏi <br />
                  cần ôn tập ngay
                </h2>
                <p className="text-blue-100 max-w-sm mb-8 leading-relaxed">
                  Đừng để kiến thức trôi xa! Hoàn thành bài tập Spaced
                  Repetition hôm nay để tối ưu trí nhớ dài hạn.
                </p>
              </div>
              <button className="self-start bg-white text-blue-700 px-8 py-4 rounded-2xl font-bold hover:shadow-lg hover:-translate-y-1 transition-all flex items-center gap-2 active:scale-95">
                Bắt đầu ngay <Zap className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Analytics Card */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col min-w-0 group hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900">Năng lực môn học</h3>
              <div className="p-2 bg-slate-50 rounded-xl">
                <ChartLine className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="flex-1 min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%" aspect={1}>
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  data={radarData}
                >
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                  />
                  <Radar
                    name="Student"
                    dataKey="A"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Hoạt động gần đây
            </h2>
            <button
              type="button"
              className="text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              Xem tất cả
            </button>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6">
            {isLoading ? (
              <p className="text-slate-500">Đang tải hoạt động...</p>
            ) : recentActivities.length === 0 ? (
              <p className="text-slate-500">
                Chưa có hoạt động học tập gần đây.
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
                  >
                    <p className={`text-sm font-semibold ${activity.tone}`}>
                      {activity.label}
                    </p>
                    <span className="text-xs text-slate-500">
                      {new Date(activity.timestamp).toLocaleString("vi-VN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Lịch sử làm bài
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-pulse h-48"
                ></div>
              ))
            ) : attemptHistory.length === 0 ? (
              <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">
                Bạn chưa có lịch sử làm bài. Hãy bắt đầu một đề thi để hệ thống
                lưu tiến trình.
              </div>
            ) : (
              attemptHistory.slice(0, 6).map((attempt) => (
                <div
                  key={attempt.attemptId}
                  className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                      <Zap className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" />{" "}
                      {new Date(attempt.startedAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <h3
                    className="font-bold text-slate-900 mb-2 truncate group-hover:text-blue-600 transition-colors"
                    title={attempt.examTitle}
                  >
                    {attempt.examTitle}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Trạng thái: {attempt.status}
                  </p>
                  <div className="flex items-center justify-between mt-6">
                    <span className="text-sm font-bold text-slate-400">
                      Điểm:{" "}
                      <span className="text-slate-900">
                        {typeof attempt.scoreRaw === "number" &&
                        typeof attempt.scoreMax === "number"
                          ? `${attempt.scoreRaw}/${attempt.scoreMax}`
                          : "--"}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/dashboard/attempts/${attempt.attemptId}/result`,
                        )
                      }
                      className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition-all active:scale-95"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
