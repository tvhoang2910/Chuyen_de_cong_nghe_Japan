export type SystemAdminRole =
  | "USER"
  | "CONTRIBUTOR"
  | "ADMIN"
  | "AUDIT"
  | "SYSTEM_ADMIN";

export type SystemAdminUserStatus = "ACTIVE" | "LOCKED";

export type SystemLogSeverity = "INFO" | "WARNING" | "ERROR";

export type SystemLogAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "CHANGE_ROLE"
  | "LOCK_USER"
  | "UNLOCK_USER";

export type SystemAdminUser = {
  id: number;
  avatarUrl: string;
  fullName: string;
  email: string;
  role: SystemAdminRole;
  status: SystemAdminUserStatus;
  createdAt: string;
  phoneNumber: string;
  department: string;
};

export type SystemLogItem = {
  id: string;
  action: SystemLogAction;
  actor: string;
  target: string;
  targetType: string;
  severity: SystemLogSeverity;
  createdAt: string;
  description: string;
};

export type SystemActivityItem = {
  id: string;
  title: string;
  actor: string;
  createdAt: string;
  status: "THÀNH_CÔNG" | "CẢNH_BÁO" | "THẤT_BẠI";
};

export type ServiceHealthItem = {
  serviceName: "auth_service" | "exam_service" | "notification_service";
  status: "Hoạt động" | "Ngừng hoạt động";
  lastCheckedAt: string;
};

export const systemAdminUsersMock: SystemAdminUser[] = [
  {
    id: 101,
    avatarUrl:
      "https://ui-avatars.com/api/?name=Nguyen+An+Khang&background=0f172a&color=fff",
    fullName: "Nguyễn An Khang",
    email: "khang.nguyen@jstudy.vn",
    role: "SYSTEM_ADMIN",
    status: "ACTIVE",
    createdAt: "2025-11-12T09:10:00",
    phoneNumber: "0909123456",
    department: "Hạ tầng hệ thống",
  },
  {
    id: 102,
    avatarUrl:
      "https://ui-avatars.com/api/?name=Tran+Thi+Ngoc&background=0369a1&color=fff",
    fullName: "Trần Thị Ngọc",
    email: "ngoc.tran@jstudy.vn",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: "2025-09-18T08:30:00",
    phoneNumber: "0918222333",
    department: "Vận hành nội dung",
  },
  {
    id: 103,
    avatarUrl:
      "https://ui-avatars.com/api/?name=Le+Minh+Tien&background=0891b2&color=fff",
    fullName: "Lê Minh Tiến",
    email: "tien.le@jstudy.vn",
    role: "AUDIT",
    status: "ACTIVE",
    createdAt: "2025-09-12T11:20:00",
    phoneNumber: "0903555666",
    department: "Kiểm toán nội bộ",
  },
  {
    id: 104,
    avatarUrl:
      "https://ui-avatars.com/api/?name=Phan+Bao+Chau&background=334155&color=fff",
    fullName: "Phan Bảo Châu",
    email: "chau.phan@jstudy.vn",
    role: "CONTRIBUTOR",
    status: "ACTIVE",
    createdAt: "2025-12-01T13:40:00",
    phoneNumber: "0933666999",
    department: "Nhóm đề thi",
  },
  {
    id: 105,
    avatarUrl:
      "https://ui-avatars.com/api/?name=Vu+Hoang+Long&background=164e63&color=fff",
    fullName: "Vũ Hoàng Long",
    email: "long.vu@jstudy.vn",
    role: "USER",
    status: "LOCKED",
    createdAt: "2026-01-22T10:15:00",
    phoneNumber: "0988777666",
    department: "Học viên",
  },
  {
    id: 106,
    avatarUrl:
      "https://ui-avatars.com/api/?name=Do+Thanh+Ha&background=1d4ed8&color=fff",
    fullName: "Đỗ Thanh Hà",
    email: "ha.do@jstudy.vn",
    role: "USER",
    status: "ACTIVE",
    createdAt: "2026-02-02T08:00:00",
    phoneNumber: "0902555888",
    department: "Học viên",
  },
  {
    id: 107,
    avatarUrl:
      "https://ui-avatars.com/api/?name=Ngo+Huu+Dat&background=0f766e&color=fff",
    fullName: "Ngô Hữu Đạt",
    email: "dat.ngo@jstudy.vn",
    role: "CONTRIBUTOR",
    status: "ACTIVE",
    createdAt: "2026-02-10T14:50:00",
    phoneNumber: "0922999111",
    department: "Nhóm đề thi",
  },
  {
    id: 108,
    avatarUrl:
      "https://ui-avatars.com/api/?name=Hoang+Mai+Linh&background=9f1239&color=fff",
    fullName: "Hoàng Mai Linh",
    email: "linh.hoang@jstudy.vn",
    role: "USER",
    status: "LOCKED",
    createdAt: "2026-02-18T17:25:00",
    phoneNumber: "0966555444",
    department: "Học viên",
  },
  {
    id: 109,
    avatarUrl:
      "https://ui-avatars.com/api/?name=Bui+Gia+Bao&background=0369a1&color=fff",
    fullName: "Bùi Gia Bảo",
    email: "bao.bui@jstudy.vn",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: "2025-10-03T09:35:00",
    phoneNumber: "0944333222",
    department: "Quản trị nội dung",
  },
  {
    id: 110,
    avatarUrl:
      "https://ui-avatars.com/api/?name=Pham+Anh+Thu&background=4f46e5&color=fff",
    fullName: "Phạm Anh Thư",
    email: "thu.pham@jstudy.vn",
    role: "USER",
    status: "ACTIVE",
    createdAt: "2026-03-01T08:20:00",
    phoneNumber: "0901444777",
    department: "Học viên",
  },
  {
    id: 111,
    avatarUrl:
      "https://ui-avatars.com/api/?name=Huynh+Quoc+Khanh&background=0284c7&color=fff",
    fullName: "Huỳnh Quốc Khánh",
    email: "khanh.huynh@jstudy.vn",
    role: "AUDIT",
    status: "ACTIVE",
    createdAt: "2025-11-29T15:10:00",
    phoneNumber: "0909888777",
    department: "Kiểm toán nội bộ",
  },
  {
    id: 112,
    avatarUrl:
      "https://ui-avatars.com/api/?name=Nguyen+Nhat+Nam&background=7c3aed&color=fff",
    fullName: "Nguyễn Nhật Nam",
    email: "nam.nguyen@jstudy.vn",
    role: "USER",
    status: "ACTIVE",
    createdAt: "2026-03-06T10:05:00",
    phoneNumber: "0913555777",
    department: "Học viên",
  },
];

export const systemLogMock: SystemLogItem[] = [
  {
    id: "LOG-1024",
    action: "LOGIN_SUCCESS",
    actor: "khang.nguyen@jstudy.vn",
    target: "Cổng quản trị",
    targetType: "AUTH",
    severity: "INFO",
    createdAt: "2026-05-09T08:30:00",
    description: "Đăng nhập thành công qua web admin.",
  },
  {
    id: "LOG-1025",
    action: "LOGIN_FAILED",
    actor: "long.vu@jstudy.vn",
    target: "Tài khoản #105",
    targetType: "AUTH",
    severity: "WARNING",
    createdAt: "2026-05-09T08:34:00",
    description: "Nhập sai mật khẩu 3 lần liên tiếp.",
  },
  {
    id: "LOG-1026",
    action: "CHANGE_ROLE",
    actor: "khang.nguyen@jstudy.vn",
    target: "dat.ngo@jstudy.vn",
    targetType: "USER",
    severity: "INFO",
    createdAt: "2026-05-09T08:40:00",
    description: "Cập nhật vai trò từ USER sang CONTRIBUTOR.",
  },
  {
    id: "LOG-1027",
    action: "LOCK_USER",
    actor: "ngoc.tran@jstudy.vn",
    target: "linh.hoang@jstudy.vn",
    targetType: "USER",
    severity: "WARNING",
    createdAt: "2026-05-09T08:45:00",
    description: "Khóa tài khoản do đăng nhập bất thường.",
  },
  {
    id: "LOG-1028",
    action: "UNLOCK_USER",
    actor: "khang.nguyen@jstudy.vn",
    target: "long.vu@jstudy.vn",
    targetType: "USER",
    severity: "INFO",
    createdAt: "2026-05-09T08:53:00",
    description: "Mở khóa sau khi xác thực danh tính.",
  },
  {
    id: "LOG-1029",
    action: "LOGIN_FAILED",
    actor: "unknown",
    target: "API /auth/login",
    targetType: "AUTH",
    severity: "ERROR",
    createdAt: "2026-05-09T09:01:00",
    description: "Nhiều request thất bại từ IP lạ.",
  },
  {
    id: "LOG-1030",
    action: "LOCK_USER",
    actor: "huynh.quoc.khanh@jstudy.vn",
    target: "Tài khoản #304",
    targetType: "USER",
    severity: "ERROR",
    createdAt: "2026-05-09T09:12:00",
    description: "Khóa khẩn cấp do nghi ngờ chiếm quyền.",
  },
  {
    id: "LOG-1031",
    action: "LOGIN_SUCCESS",
    actor: "ngoc.tran@jstudy.vn",
    target: "Cổng quản trị",
    targetType: "AUTH",
    severity: "INFO",
    createdAt: "2026-05-09T09:20:00",
    description: "Đăng nhập xác thực 2 lớp thành công.",
  },
];

export const systemActivityMock: SystemActivityItem[] = [
  {
    id: "ACT-01",
    title: "Đổi vai trò người dùng",
    actor: "Nguyễn An Khang",
    createdAt: "2026-05-09T08:40:00",
    status: "THÀNH_CÔNG",
  },
  {
    id: "ACT-02",
    title: "Khóa tài khoản bất thường",
    actor: "Trần Thị Ngọc",
    createdAt: "2026-05-09T08:45:00",
    status: "CẢNH_BÁO",
  },
  {
    id: "ACT-03",
    title: "Đồng bộ quyền truy cập thất bại",
    actor: "Hệ thống",
    createdAt: "2026-05-09T09:04:00",
    status: "THẤT_BẠI",
  },
  {
    id: "ACT-04",
    title: "Mở khóa tài khoản",
    actor: "Nguyễn An Khang",
    createdAt: "2026-05-09T09:11:00",
    status: "THÀNH_CÔNG",
  },
];

export const serviceHealthMock: ServiceHealthItem[] = [
  {
    serviceName: "auth_service",
    status: "Hoạt động",
    lastCheckedAt: "2026-05-09T09:15:00",
  },
  {
    serviceName: "exam_service",
    status: "Hoạt động",
    lastCheckedAt: "2026-05-09T09:15:00",
  },
  {
    serviceName: "notification_service",
    status: "Ngừng hoạt động",
    lastCheckedAt: "2026-05-09T09:15:00",
  },
];

export const roleLabelMap: Record<SystemAdminRole, string> = {
  USER: "Người dùng",
  CONTRIBUTOR: "Cộng tác viên",
  ADMIN: "Quản trị viên",
  AUDIT: "Kiểm toán",
  SYSTEM_ADMIN: "Quản trị hệ thống",
};

export const roleOptions: Array<{ value: SystemAdminRole; label: string }> = [
  { value: "USER", label: "Người dùng" },
  { value: "CONTRIBUTOR", label: "Cộng tác viên" },
  { value: "ADMIN", label: "Quản trị viên" },
  { value: "AUDIT", label: "Kiểm toán" },
  { value: "SYSTEM_ADMIN", label: "Quản trị hệ thống" },
];

export const actionOptions: Array<{
  value: "ALL" | SystemLogAction;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả hành động" },
  { value: "LOGIN_SUCCESS", label: "Đăng nhập thành công" },
  { value: "LOGIN_FAILED", label: "Đăng nhập thất bại" },
  { value: "CHANGE_ROLE", label: "Đổi vai trò" },
  { value: "LOCK_USER", label: "Khóa tài khoản" },
  { value: "UNLOCK_USER", label: "Mở khóa tài khoản" },
];

export const severityOptions: Array<{
  value: "ALL" | SystemLogSeverity;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả mức độ" },
  { value: "INFO", label: "Thông tin" },
  { value: "WARNING", label: "Cảnh báo" },
  { value: "ERROR", label: "Lỗi" },
];
