# Bàn giao sang agent Expo

Chat website (`Apartment01`) chỉ viết playbook Hướng 1. **Code app** làm ở workspace Expo, chat Agent mới.

## Việc bạn làm trên Cursor

1. **File → Open Folder** (hoặc Open Workspace) trỏ vào **root khung Expo** (thư mục có `app.json` / `package.json` với `expo`).
2. Mở **Chat → Agent** mới (không tiếp tục chat website).
3. `@` các file đã copy (mục dưới) rồi dán prompt starter.

Không dùng chat này để sửa file Expo: root hiện tại là website Next.js.

## Copy playbook vào repo Expo

Từ `D:\Workspace\Apartment\Apartment01` sang root Expo:

```
.cursor/skills/mobile-firebase-sync/     →  <expo>/.cursor/skills/mobile-firebase-sync/
.cursor/rules/mobile-firebase-sync.mdc   →  <expo>/.cursor/rules/mobile-firebase-sync.mdc
docs/mobile/                             →  <expo>/docs/mobile/
```

Giữ nguyên cấu trúc thư mục. Sửa link trong skill nếu Expo không nằm cạnh `Apartment01` — các link `../../../docs/mobile/` vẫn đúng nếu `docs/mobile` nằm ở root Expo.

Không copy cả website. Shared code (`types.ts`, `rbac.ts`, …) agent Expo sẽ lấy từ website khi implement Phase 0.

## Prompt dán vào Agent Expo

```
Làm theo Hướng 1: app Expo là client Firebase thứ hai của website Hanoi Residences (project quang-apartment). Không clone database, không REST bọc Server Actions.

Đọc theo thứ tự:
1. docs/mobile/GRAPH_REPORT.md
2. docs/mobile/NOTES.md
3. docs/mobile/IMPLEMENTATION_PLAN.md
4. .cursor/skills/mobile-firebase-sync/SKILL.md và feature-parity.md

Khảo sát khung Expo hiện có (router, auth, Firebase đã gắn chưa). Đối chiếu feature-parity. Bắt đầu Phase 0–1: rules/indexes nếu thiếu, rồi Auth + user doc. Đừng xóa UI/khung đã có. Mọi đọc/ghi Firebase try/catch.

Website tham chiếu (chỉ đọc): D:\Workspace\Apartment\Apartment01
```

Thêm `@docs/mobile` và `@.cursor/skills/mobile-firebase-sync/SKILL.md` trong ô chat.

## Nếu agent Expo cần đọc website

- Cách A: trong prompt ghi path tuyệt đối website (như trên). Agent có thể đọc file ngoài root tùy quyền.
- Cách B: Cursor **Add Folder to Workspace** — thêm `Apartment01` thành multi-root. Vẫn **chat mới** trên workspace đó; nói rõ “chỉ sửa Expo, website read-only”.

## Không làm

- `move_agent_to_root` chat website này sang Expo (bạn đã chọn chat mới).
- Đưa `GROQ_API_KEY` / service account vào Expo.
- Viết API Next cho app.
