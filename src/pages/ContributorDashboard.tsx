import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  FileUp,
  Flag,
  LayoutDashboard,
  Upload,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";

const contributorActions = [
  {
    title: "Quản lý đề thi",
    description: "Tạo, chỉnh sửa và quản lý câu hỏi trong kho đề.",
    path: "/contributor/exams",
    icon: BookOpen,
  },
  {
    title: "Duyệt upload",
    description: "Xem yêu cầu upload đang chờ duyệt và kích hoạt trích xuất AI.",
    path: "/contributor/upload-queue",
    icon: Upload,
  },
  {
    title: "Báo cáo câu hỏi",
    description: "Kiểm tra câu hỏi bị báo lỗi và cập nhật trạng thái xử lý.",
    path: "/contributor/reports",
    icon: Flag,
  },
  {
    title: "Đề đã upload",
    description: "Theo dõi các file đề thi bạn đã gửi lên hệ thống.",
    path: "/my-uploads",
    icon: FileUp,
  },
];

const ContributorDashboard: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-cyan-700">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Contributor Workspace
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                Tổng quan đóng góp đề thi
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Không gian này chỉ tập trung vào đề thi, upload và xử lý báo
                cáo câu hỏi. Các luồng Premium, thanh toán và quản trị hệ thống
                được tách khỏi vai trò Contributor.
              </p>
            </div>

            <Link
              to="/contributor/exams"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 hover:bg-cyan-700"
            >
              Mở kho đề
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {contributorActions.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-xl bg-slate-100 p-3 text-slate-700 group-hover:bg-cyan-50 group-hover:text-cyan-700">
                  <item.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-cyan-600" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </Link>
          ))}
        </section>
      </div>
    </AdminLayout>
  );
};

export default ContributorDashboard;
