# App mobile — Hướng 1 (cùng Firebase)

Đồng bộ **toàn bộ chức năng website** Hanoi Residences sang app bằng cách dùng **cùng project Firebase**, không clone backend, không REST bọc Next.js.

Skill cho agent: `.cursor/skills/mobile-firebase-sync/`.

Đã có khung Expo riêng: làm theo [HANDOFF.md](HANDOFF.md) (chat Agent mới trên folder app, copy skill/docs sang đó).

## Đọc theo thứ tự

1. [GRAPH_REPORT.md](GRAPH_REPORT.md) — bản đồ kiến trúc web ↔ app
2. [NOTES.md](NOTES.md) — lưu ý bắt buộc, bẫy rules/auth/AI
3. [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — làm từng phase
4. Checklist chức năng: `.cursor/skills/mobile-firebase-sync/feature-parity.md`
5. Schema: `.cursor/skills/mobile-firebase-sync/data-model.md`
6. AI & quyền: `.cursor/skills/mobile-firebase-sync/privileged-ops.md`

## Quyết định đã chốt

| Chọn | Không chọn |
|---|---|
| Expo + Firebase JS SDK, project `quang-apartment` | Database/Storage riêng cho mobile |
| Auth UID trùng website | Bọc Server Actions thành API |
| Cloud Function chỉ cho Groq/AI (và sau này rules chặt) | Đưa API key AI vào app |
| Chia sẻ `types`, `rbac`, search, quận, giá | Copy-paste UI Next/Shadcn sang RN |

## Hai client, một nguồn sự thật

```
[Next.js web] ──┐
                ├── Firebase Auth
[Expo app]  ───┤── Cloud Firestore
                └── Cloud Storage
                     └── (sau) Cloud Functions: generateListingSummary
```

Sửa tin trên web → app thấy (và ngược lại) vì cùng document.

## Việc làm trước khi code UI app

1. So rules **đã deploy** với `firestore.rules` / `storage.rules` trong repo (file repo đang thiếu booking + notification).
2. Tách (hoặc copy có kiểm soát) module shared: types, constants, rbac, price-range, source-code, search keywords.
3. Tạo app Firebase **Android** (và iOS nếu cần) trong cùng project, thêm `google-services.json` / `GoogleService-Info.plist`.
4. Làm Phase 0 trong IMPLEMENTATION_PLAN (rules + indexes).
