# SYSTEM_ADMIN Authentication & Authorization Guide

## Flow Authentication hiện tại

Hệ thống đã implement ProtectedRoute component để guard quyền truy cập:

```typescript
<ProtectedRoute
  isAuthenticated={effectiveIsAuthenticated}
  userRole={effectiveRole}
  defaultPath={defaultAuthenticatedPath}
  allowedRoles={["SYSTEM_ADMIN"]}
>
  <SystemAdminDashboard />
</ProtectedRoute>
```

**Flow:**

1. Check user đã authenticate (có `access_token` trong localStorage)
2. Check role từ localStorage (`user_role`)
3. Nếu role không nằm trong `allowedRoles` → redirect về `defaultPath` (dashboard của role đó)
4. Nếu không authenticate → redirect về `/login`

## SYSTEM_ADMIN Routes

Tất cả routes của SYSTEM_ADMIN được protect bởi ProtectedRoute và chỉ cho phép role `SYSTEM_ADMIN`:

- `/admin/system/dashboard` - Dashboard kỹ thuật
- `/admin/system/users` - Quản lý người dùng & phân quyền
- `/admin/system/logs` - Nhật ký hệ thống

## Testing Auth Flow (Development Mode)

### 1. Bật Dev Auth Console

Khi chạy `npm run build` hoặc `npm run dev`, dev auth console sẽ tự động load.

Trong browser console, gõ:

```javascript
window.__mockAuth.help();
```

### 2. Mock Login as SYSTEM_ADMIN

```javascript
window.__mockAuth.loginAsSystemAdmin();
```

Sau đó:

- Reload trang → sẽ tự động redirect về `/admin/system/dashboard`
- Sidebar sẽ hiển thị 3 menu của SYSTEM_ADMIN:
  - Dashboard kỹ thuật
  - Quản lý người dùng & phân quyền
  - Nhật ký hệ thống

### 3. Test Unauthorized Access

```javascript
// Login as AUDIT (không phải SYSTEM_ADMIN)
window.__mockAuth.loginAsAudit();

// Reload trang
location.reload();

// Cố gắng truy cập SYSTEM_ADMIN route
location.href = "/admin/system/dashboard";

// Kỳ vọng: Bị redirect về /admin/audit/vip (dashboard của AUDIT)
```

### 4. View Current Mock User

```javascript
window.__mockAuth.currentUser();
```

Output:

```javascript
{
  id: 5,
  email: "sysadmin@jstudy.vn",
  fullName: "Quản Trị Hệ Thống Test",
  role: "SYSTEM_ADMIN"
}
```

### 5. Logout

```javascript
window.__mockAuth.logout();
location.reload();

// Kỳ vọng: Redirect về /login
```

## Available Mock Roles

```javascript
window.__mockAuth.roles;
// Output: ["USER", "CONTRIBUTOR", "ADMIN", "AUDIT", "SYSTEM_ADMIN"]

// Login as bất kỳ role nào:
window.__mockAuth.loginAsUser();
window.__mockAuth.loginAsContributor();
window.__mockAuth.loginAsAdmin();
window.__mockAuth.loginAsAudit();
window.__mockAuth.loginAsSystemAdmin();
```

## Sidebar Dynamic Menu

AdminLayout component tự động render menu khác nhau dựa trên role:

```typescript
if (user?.role === "SYSTEM_ADMIN") {
  // Hiển thị 3 menu: Dashboard kỹ thuật, Quản lý users, Nhật ký
}
if (user?.role === "AUDIT") {
  // Hiển thị 3 menu: Duyệt VIP, Thanh toán, Nhật ký
}
// ... các role khác
```

## How to Disable Dev Auth Console

Dev auth console chỉ tải trong 2 trường hợp:

1. URL có query param: `?dev-auth=true`
2. Build mode là development (`import.meta.env.DEV`)

Khi build production, `import.meta.env.DEV = false` → dev console không tải.

## Authorization Rules

| Route              | Allowed Roles | Redirect to                 |
| ------------------ | ------------- | --------------------------- |
| `/admin/system/*`  | SYSTEM_ADMIN  | Dashboard của role hiện tại |
| `/admin/audit/*`   | AUDIT         | `/admin/audit/vip`          |
| `/admin/users`     | ADMIN         | `/admin/users`              |
| `/admin/dashboard` | ADMIN         | `/admin/users`              |
| `/dashboard`       | USER          | `/dashboard`                |
| `/contributor`     | CONTRIBUTOR   | `/contributor`              |

## Current User & Role Persistence

- **Token:** Stored in `localStorage.access_token`
- **Role:** Stored in `localStorage.user_role`
- **Profile Cache:** Stored in `localStorage` với prefix `profile:`

Khi user login thực tế, backend sẽ gọi `persistAuthSession()` để set cả hai.

## Next Steps: Backend Integration

Khi backend API hoàn thiện:

1. Thay `mockLoginAsRole()` bằng gọi API `/login` thực tế
2. Backend trả về JWT token + role
3. Frontend gọi `persistAuthSession()` để save auth state
4. Flow authorization vẫn giống hệt (không cần thay code)
5. Xoá file `src/utils/devAuthMock.ts` khi không dùng

## Files Reference

- **Route Setup:** `src/App.tsx` (lines 106-107, 534-568)
- **ProtectedRoute Logic:** `src/App.tsx` (lines 81-90)
- **Sidebar/Menu:** `src/components/AdminLayout.tsx` (lines 310-330)
- **Dev Auth Mock:** `src/utils/devAuthMock.ts`
- **Role Type:** `src/api/axiosClient.ts` (line 21-26)
- **Auth Session:** `src/api/axiosClient.ts` (lines 510-560)
