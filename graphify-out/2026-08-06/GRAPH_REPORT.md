# Graph Report - Apartment01  (2026-08-06)

## Corpus Check
- 152 files · ~190,102 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 971 nodes · 1854 edges · 106 communities (46 shown, 60 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d2d33011`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- provider.tsx
- index.ts
- apartment-form.tsx
- sidebar.tsx
- rbac.ts
- devDependencies
- errors.ts
- compilerOptions
- actions.ts
- cn
- card.tsx
- apartment-details-page-client.tsx
- data-client.ts
- components.json
- use-toast.ts
- signup/page.tsx
- menubar.tsx
- chart.tsx
- apartments/page.tsx
- react
- 🛠️ Chi Tiết Kỹ Thuật Các Tính Năng Đã Thực Hiện
- dependencies
- 3. Tổng Hợp Các File & Phương Thức Đã Chỉnh Sửa
- 📂 2. Chi Tiết Thay Đổi Trên Từng File (File Changes)
- 🛠️ Chi Tiết Các Tính Năng & Thay Đổi Kỹ Thuật
- user-nav.tsx
- 🚀 Nâng Cấp Toàn Diện Hệ Thống Đặt Lịch & Quản Lý Khách Hàng (CRM)
- What You Must Do When Invoked
- sheet.tsx
- notification-bell.tsx
- Cập Nhật & Tối Ưu Giao Diện Chi Tiết Căn Hộ
- @radix-ui/react-toast
- class-variance-authority
- clsx
- date-fns
- date-fns-tz
- @dnd-kit/core
- @dnd-kit/sortable
- dotenv
- embla-carousel-react
- firebase
- firebase-admin
- framer-motion
- genkit
- APARTMENT01_CONTEXT.md
- hono
- @hookform/resolvers
- lucide-react
- next
- next.config.js
- **App Name**: Hanoi Residences
- @opentelemetry/exporter-jaeger
- @radix-ui/react-accordion
- @radix-ui/react-alert-dialog
- @radix-ui/react-avatar
- @radix-ui/react-checkbox
- @radix-ui/react-collapsible
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-label
- @radix-ui/react-menubar
- @radix-ui/react-popover
- @radix-ui/react-progress
- @radix-ui/react-radio-group
- 📂 Lịch Sử Cập Nhật Hệ Thống (Changelogs)
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-slider
- @radix-ui/react-slot
- @radix-ui/react-tooltip
- react-day-picker
- react-markdown
- react-phone-number-input
- recharts
- sharp
- tailwind-merge
- tailwindcss-animate
- uuid
- postcss.config.mjs
- genkit.ts
- global.d.ts
- tailwind.config.ts
- badge.tsx
- graphify reference: extra exports and benchmark
- graphify reference: query, path, explain
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- CLAUDE.md
- .claude/CLAUDE.md
- extraction-spec.md
- copilot-instructions.md
- @genkit-ai/google-genai
- openai
- react-dom
- react-hook-form
- zod
- separator.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 77 edges
2. `cn()` - 71 edges
3. `useToast()` - 28 edges
4. `useAuth()` - 23 edges
5. `db` - 18 edges
6. `Button` - 17 edges
7. `compilerOptions` - 17 edges
8. `useUser()` - 16 edges
9. `Apartment` - 14 edges
10. `Header()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `ApartmentDetailsPageClient()` --references--> `jszip`  [EXTRACTED]
  src/components/apartment-details-page-client.tsx → package.json
- `useCarousel()` --references--> `react`  [EXTRACTED]
  src/components/ui/carousel.tsx → package.json
- `useChart()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json
- `useFormField()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json
- `useSidebar()` --references--> `react`  [EXTRACTED]
  src/components/ui/sidebar.tsx → package.json

## Import Cycles
- 3-file cycle: `src/context/auth-context.tsx -> src/firebase/index.ts -> src/firebase/client-provider.tsx -> src/context/auth-context.tsx`

## Communities (106 total, 60 thin omitted)

### Community 0 - "provider.tsx"
Cohesion: 0.21
Nodes (11): AdminLayoutContent(), FirebaseContext, FirebaseContextState, FirebaseProviderProps, FirebaseServicesAndUser, useAuth(), useFirebase(), useFirebaseApp() (+3 more)

### Community 1 - "index.ts"
Cohesion: 0.06
Nodes (57): AboutSection(), AddBookingModal(), removeVietnameseTones(), CancelConfirmModal(), DeleteConfirmModal(), DetailsModal(), formatBookingTime(), formatCreationDate() (+49 more)

### Community 2 - "apartment-form.tsx"
Cohesion: 0.07
Nodes (40): generateSummaryAction(), getRoomTypeLabel(), ACCEPTED_IMAGE_TYPES, ApartmentForm(), ApartmentFormProps, compressImage(), createInitialPreviewItems(), createPreviewId() (+32 more)

### Community 3 - "sidebar.tsx"
Cohesion: 0.11
Nodes (25): Sidebar, SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel (+17 more)

### Community 4 - "rbac.ts"
Cohesion: 0.12
Nodes (5): useUserRole(), getCurrentUserRole(), Permission, ROLE_PERMISSIONS, UserRole

### Community 5 - "devDependencies"
Cohesion: 0.05
Nodes (38): genkit-cli, devDependencies, genkit-cli, patch-package, postcss, tailwindcss, @tailwindcss/typography, @types/node (+30 more)

### Community 6 - "errors.ts"
Cohesion: 0.09
Nodes (19): FirebaseErrorListener(), AppEvents, Callback, errorEmitter, buildAuthObject(), buildErrorMessage(), buildRequestObject(), FirebaseAuthObject (+11 more)

### Community 7 - "compilerOptions"
Cohesion: 0.07
Nodes (29): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node, node_modules, react-dom (+21 more)

### Community 8 - "actions.ts"
Cohesion: 0.06
Nodes (51): generateListingSummary(), generateSlug(), groq, tokenWindow, waitForTokenBudget(), apartmentActionSchema, apartmentBaseSchema, checkFavoriteStatusAction() (+43 more)

### Community 9 - "cn"
Cohesion: 0.15
Nodes (19): DocNode, docsTree, SOPDocsPage(), NavLink(), Button, ButtonProps, buttonVariants, Calendar() (+11 more)

### Community 10 - "card.tsx"
Cohesion: 0.27
Nodes (8): PENDING_BOOKING_COLLECTIONS, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Skeleton()

### Community 11 - "apartment-details-page-client.tsx"
Cohesion: 0.07
Nodes (31): jszip, jszip, react, react, montserrat, ShareModal(), titleFont, ApartmentImageGallery() (+23 more)

### Community 12 - "data-client.ts"
Cohesion: 0.06
Nodes (42): fetchApartmentsAction(), ApartmentForm, EditApartmentPageProps, ApartmentForm, montserrat, titleFont, ApartmentFormSkeleton(), ApartmentList() (+34 more)

### Community 13 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 14 - "use-toast.ts"
Cohesion: 0.07
Nodes (32): beVietnamPro, metadata, playfairDisplay, MultiContact(), Toast, ToastAction, ToastActionElement, ToastClose (+24 more)

### Community 15 - "signup/page.tsx"
Cohesion: 0.20
Nodes (12): LoginContent(), ResetPasswordContent(), SignupContent(), confirmResetPassword(), login(), loginWithGoogle(), signup(), checkPasswordMatch() (+4 more)

### Community 16 - "menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 17 - "chart.tsx"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 18 - "apartments/page.tsx"
Cohesion: 0.16
Nodes (19): ManageableRole, UserData, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader() (+11 more)

### Community 19 - "react"
Cohesion: 0.08
Nodes (19): react, AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription, AlertTitle, alertVariants (+11 more)

### Community 20 - "🛠️ Chi Tiết Kỹ Thuật Các Tính Năng Đã Thực Hiện"
Cohesion: 0.17
Nodes (11): 1. Tối Ưu Hóa Technical SEO & Dữ Liệu Có Cấu Trúc (Schema Markup), 2. Tăng Cường Bảo Mật & Quản Lý Mã Nguồn (Next.js & TS), 3. Cải Tiến Trải Nghiệm Người Dùng (UX) & Accessibility, 4. Nâng Cấp Hệ Thống AI Tạo Nội Dung (Content Generation Engine), 5. Tối Ưu PageSpeed Insights (Font Loading), 6. Sitemap Động (Dynamic Sitemap từ Firestore), 7. Nâng Cấp Bộ Lọc Multi-Select (`district`/`roomType`), 🚀 Báo Cáo Kỹ Thuật: Tối Ưu SEO Toàn Diện, Bảo Mật Next.js, UX & Hệ Thống AI (+3 more)

### Community 21 - "dependencies"
Cohesion: 0.15
Nodes (13): @genkit-ai/googleai, @genkit-ai/next, node-cache, dependencies, @genkit-ai/googleai, @genkit-ai/next, node-cache, @radix-ui/react-scroll-area (+5 more)

### Community 22 - "3. Tổng Hợp Các File & Phương Thức Đã Chỉnh Sửa"
Cohesion: 0.20
Nodes (9): 1. Tính Năng & Logic Vận Hành Mới (Business Logic), 2. Cải Tiến Giao Diện (UI/UX Enhancements), 3.1. `src/lib/types.ts`, 3.2. `src/app/actions.ts`, 3.3. `src/components/apartment-form.tsx`, 3.4. `src/components/apartment-details-page-client.tsx`, 3.5. `src/components/apartment-card.tsx`, 3. Tổng Hợp Các File & Phương Thức Đã Chỉnh Sửa (+1 more)

### Community 23 - "📂 2. Chi Tiết Thay Đổi Trên Từng File (File Changes)"
Cohesion: 0.20
Nodes (9): 📦 1. Thư Viện (Packages) Mới Được Thêm Vào, 📂 2. Chi Tiết Thay Đổi Trên Từng File (File Changes), 🗄️ Backend Logic & Database, 📝 Bản Vá & Cập Nhật: Tích Hợp AI SEO, Khắc Phục Cache & Giao Diện Đa Quyền (31/07/2026), ⚙️ Cấu Hình Hệ Thống, 🧠 Dữ Liệu & Khởi Tạo AI, 🌐 Frontend - Layout & Rendering, 🎨 Frontend - Trang Chi Tiết & Giao Diện Người Dùng (+1 more)

### Community 24 - "🛠️ Chi Tiết Các Tính Năng & Thay Đổi Kỹ Thuật"
Cohesion: 0.20
Nodes (9): 1. Hệ Thống Thông Báo & Triggers Đa Luồng (`src/lib/notifications.ts`, `booking-widget.tsx`, `auth-service.ts`), 2. Chuẩn Hóa Câu Chữ (Wording) Trong Thông Báo, 3. Nâng Cấp Giao Diện Popover Chuông Thông Báo (`notification-bell.tsx`, `use-notifications.ts`), 4. Tối Ưu Trang Tổng Quan Admin (`[adminPath]/page.tsx`), 5. Bộ Lọc Trạng Thái Tại Trang Quản Lý Lịch Hẹn Admin (`[adminPath]/bookings/page.tsx`), 6. Vá Lỗi & Dọn Dẹp Giao Diện Profile User (`profile/page.tsx`), 🛠️ Chi Tiết Các Tính Năng & Thay Đổi Kỹ Thuật, 🚀 Nâng Cấp Hệ Thống Thông Báo Toàn Diện & Quản Lý Admin (+1 more)

### Community 25 - "user-nav.tsx"
Cohesion: 0.15
Nodes (14): ContactCardProps, Avatar, AvatarFallback, AvatarImage, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel (+6 more)

### Community 26 - "🚀 Nâng Cấp Toàn Diện Hệ Thống Đặt Lịch & Quản Lý Khách Hàng (CRM)"
Cohesion: 0.22
Nodes (8): 📖 1. Tổng Quan (Overview), 🛠 2. Chi Tiết Cấu Trúc Các Module Đã Triển Khai, 🐛 3. Các Lỗi (Bugs) Đã Xử Lý, 📱 4. Nâng Cấp UX / UI, A. Module Frontend: Booking Widget (`src/components/booking-widget.tsx`), B. Module Backend & Bảo Mật: Trang Quản Trị (`src/app/[adminPath]/bookings/page.tsx`), C. Module Khách Hàng / CTV (`src/app/(public)/profile/bookings/page.tsx`), 🚀 Nâng Cấp Toàn Diện Hệ Thống Đặt Lịch & Quản Lý Khách Hàng (CRM)

### Community 27 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 28 - "sheet.tsx"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 29 - "notification-bell.tsx"
Cohesion: 0.43
Nodes (6): formatNotificationTime(), NOTIFICATION_ICONS, NotificationBell(), AppNotification, useNotifications(), NotificationType

### Community 30 - "Cập Nhật & Tối Ưu Giao Diện Chi Tiết Căn Hộ"
Cohesion: 0.29
Nodes (6): 🎯 1. Phân Quyền & Bổ Sung Tính Năng Tải Ảnh (B2B), 📱 2. Tái Cấu Trúc Nút Tương Tác Trên Mobile (Floating UI), 🚀 3. Nâng Cấp Share Modal (Bottom Sheet & Messenger), 📖 4. Tùy Chỉnh Hiển Thị "Thông Tin Chi Tiết", 🛠️ 5. Nhận Diện Lỗi Kỹ Thuật Next.js Image, Cập Nhật & Tối Ưu Giao Diện Chi Tiết Căn Hộ

### Community 44 - "APARTMENT01_CONTEXT.md"
Cohesion: 0.33
Nodes (5): 📊 COMMUNITIES & MODULES, 🔝 GOD NODES (Most Connected Concepts), Import Cycle in Auth System:, 🚨 KNOWN ISSUES, 🔗 SURPRISING CONNECTIONS & KNOWLEDGE GAPS

### Community 50 - "**App Name**: Hanoi Residences"
Cohesion: 0.50
Nodes (3): **App Name**: Hanoi Residences, Core Features:, Style Guidelines:

### Community 64 - "📂 Lịch Sử Cập Nhật Hệ Thống (Changelogs)"
Cohesion: 0.50
Nodes (3): 📋 Bảng Mục Lục Cập Nhật, 📂 Lịch Sử Cập Nhật Hệ Thống (Changelogs), 📌 Quy Tắc Đặt Tên File Tài Liệu Mới

### Community 87 - "badge.tsx"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 88 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 89 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 90 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 91 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 92 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

## Knowledge Gaps
- **389 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+384 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **60 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`, `apartment-details-page-client.tsx`, `@radix-ui/react-toast`, `class-variance-authority`, `clsx`, `date-fns`, `date-fns-tz`, `@dnd-kit/core`, `@dnd-kit/sortable`, `dotenv`, `embla-carousel-react`, `firebase`, `firebase-admin`, `framer-motion`, `genkit`, `hono`, `@hookform/resolvers`, `lucide-react`, `next`, `@opentelemetry/exporter-jaeger`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-slot`, `@radix-ui/react-tooltip`, `react-day-picker`, `react-markdown`, `react-phone-number-input`, `recharts`, `sharp`, `tailwind-merge`, `tailwindcss-animate`, `uuid`, `@genkit-ai/google-genai`, `openai`, `react-dom`, `react-hook-form`, `zod`?**
  _High betweenness centrality (0.223) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `provider.tsx`, `index.ts`, `apartment-form.tsx`, `sidebar.tsx`, `rbac.ts`, `errors.ts`, `compilerOptions`, `actions.ts`, `cn`, `card.tsx`, `apartment-details-page-client.tsx`, `data-client.ts`, `use-toast.ts`, `signup/page.tsx`, `menubar.tsx`, `chart.tsx`, `apartments/page.tsx`, `user-nav.tsx`, `sheet.tsx`, `notification-bell.tsx`, `badge.tsx`, `separator.tsx`?**
  _High betweenness centrality (0.195) - this node is a cross-community bridge._
- **Why does `react` connect `apartment-details-page-client.tsx` to `index.ts`, `dependencies`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _389 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06374829001367989 - nodes in this community are weakly interconnected._
- **Should `apartment-form.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06845513413506013 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10582010582010581 - nodes in this community are weakly interconnected._