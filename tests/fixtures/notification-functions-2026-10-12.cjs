"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.notifyAdmins = exports.generateListingSummary = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
/**
 * Không initializeApp() ở top-level (CLI discovery Windows treo ~10s).
 * Phải `import admin from 'firebase-admin'` (không dùng `import * as admin`):
 * `__importStar` + `__esModule` làm lệch `this` → initializeApp() không
 * đăng ký default app, getFirestore() ném app/no-app → client thấy internal.
 * Luôn truyền app vào firestore(app) để không gọi getApp() trên AppStore khác.
 */
function getDb() {
    const existing = firebase_admin_1.default.apps.find((a) => a != null);
    const app = existing ??
        firebase_admin_1.default.initializeApp({
            projectId: process.env.GCLOUD_PROJECT ||
                process.env.GCP_PROJECT ||
                'quang-apartment',
        });
    console.info(JSON.stringify({
        msg: 'getDb',
        apps: firebase_admin_1.default.apps.length,
        appName: app.name,
    }));
    return firebase_admin_1.default.firestore(app);
}
function rethrowHttps(err) {
    if (err instanceof https_1.HttpsError)
        throw err;
    const message = err instanceof Error ? err.message : String(err);
    console.error('callable unhandled', message);
    throw new https_1.HttpsError('internal', message);
}
const groqApiKey = (0, params_1.defineSecret)('GROQ_API_KEY');
/**
 * Callable: generateListingSummary
 * App: httpsCallable('generateListingSummary')
 * Secret: GROQ_API_KEY (Firebase secrets / env)
 */
exports.generateListingSummary = (0, https_1.onCall)({
    region: 'asia-southeast1',
    secrets: [groqApiKey],
}, async (request) => {
    if (!request.auth?.uid) {
        throw new https_1.HttpsError('unauthenticated', 'Cần đăng nhập.');
    }
    const uid = request.auth.uid;
    const userSnap = await getDb().collection('users').doc(uid).get();
    const role = userSnap.data()?.role;
    if (role !== 'admin' && role !== 'landlord') {
        throw new https_1.HttpsError('permission-denied', 'Chỉ admin hoặc chủ nhà được gọi AI.');
    }
    const data = request.data;
    if (!data?.title || !data?.district || data.price == null) {
        throw new https_1.HttpsError('invalid-argument', 'Thiếu title/district/price.');
    }
    const apiKey = groqApiKey.value();
    if (!apiKey) {
        throw new https_1.HttpsError('failed-precondition', 'Chưa cấu hình GROQ_API_KEY.');
    }
    const formattedPrice = data.price > 0
        ? `${(data.price * 1000000).toLocaleString('de-DE')} VNĐ/tháng`
        : 'Thỏa thuận';
    const formattedArea = data.area && data.area > 0 ? `${data.area} m2` : 'Không cung cấp';
    const systemPrompt = `Bạn là chuyên gia Content SEO BĐS Hà Nội. Trả JSON:
{"seoTitle":"...","seoDescription":"...","description":"markdown","highlights":["..."]}`;
    const userPrompt = `Tiêu đề: ${data.title}
Loại: ${data.roomType}
Quận: ${data.district}
Địa chỉ: ${data.address || ''}
Giá: ${formattedPrice}
Diện tích: ${formattedArea}
Chi tiết:
${data.detailedInformation || ''}`;
    const { default: OpenAI } = await Promise.resolve().then(() => __importStar(require('openai')));
    const groq = new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
    });
    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 3000,
    });
    const content = response.choices[0]?.message?.content || '{}';
    let parsed;
    try {
        parsed = JSON.parse(content);
    }
    catch {
        throw new https_1.HttpsError('internal', 'AI trả về JSON không hợp lệ.');
    }
    return {
        seoTitle: String(parsed.seoTitle || ''),
        seoDescription: String(parsed.seoDescription || ''),
        description: String(parsed.description || '').trim(),
        highlights: Array.isArray(parsed.highlights)
            ? parsed.highlights.map(String)
            : [],
    };
});
const NOTIFICATION_TYPES = new Set([
    'new_booking',
    'status_update',
    'system',
    'landlord_request',
    'landlord_approved',
    'landlord_rejected',
    'new_submission',
    'submission_reviewed',
]);
function parseNotificationPayload(raw) {
    if (!raw || typeof raw !== 'object') {
        throw new https_1.HttpsError('invalid-argument', 'Payload không hợp lệ.');
    }
    const data = raw;
    const title = String(data.title ?? '').trim();
    const message = String(data.message ?? '').trim();
    const type = String(data.type ?? '').trim();
    const link = String(data.link ?? '').trim();
    if (!title || title.length > 200) {
        throw new https_1.HttpsError('invalid-argument', 'title không hợp lệ.');
    }
    if (!message || message.length > 2000) {
        throw new https_1.HttpsError('invalid-argument', 'message không hợp lệ.');
    }
    if (!NOTIFICATION_TYPES.has(type)) {
        throw new https_1.HttpsError('invalid-argument', 'type không hợp lệ.');
    }
    if (link.length > 500) {
        throw new https_1.HttpsError('invalid-argument', 'link quá dài.');
    }
    return { title, message, type, link };
}
async function writeNotification(recipientId, payload) {
    await getDb().collection('notifications').add({
        recipientId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        isRead: false,
        link: payload.link,
        createdAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
    });
}
/**
 * Callable: notifyAdmins
 * Auth tuỳ chọn (guest đặt lịch cũng gọi được).
 * Web: httpsCallable('notifyAdmins') hoặc HTTP POST callable protocol.
 * App: httpsCallable('notifyAdmins') — đổi notifications.ts sang callable
 * trước khi deploy firestore.rules (create: false).
 */
exports.notifyAdmins = (0, https_1.onCall)({
    region: 'asia-southeast1',
    cors: true,
    invoker: 'public',
}, async (request) => {
    try {
        const payload = parseNotificationPayload(request.data);
        const adminsSnap = await getDb()
            .collection('users')
            .where('role', '==', 'admin')
            .get();
        await Promise.all(adminsSnap.docs.map((adminDoc) => writeNotification(adminDoc.id, payload)));
        return { ok: true, count: adminsSnap.size };
    }
    catch (err) {
        rethrowHttps(err);
    }
});
/**
 * Callable: createNotification
 * Bắt buộc auth. recipientId === uid (tự thông báo) hoặc caller là admin.
 */
exports.createNotification = (0, https_1.onCall)({
    region: 'asia-southeast1',
    cors: true,
    invoker: 'public',
}, async (request) => {
    try {
        if (!request.auth?.uid) {
            throw new https_1.HttpsError('unauthenticated', 'Cần đăng nhập.');
        }
        const raw = request.data;
        const recipientId = String(raw?.recipientId ?? '').trim();
        if (!recipientId || recipientId.length > 128) {
            throw new https_1.HttpsError('invalid-argument', 'recipientId không hợp lệ.');
        }
        const payload = parseNotificationPayload(raw);
        if (recipientId !== request.auth.uid) {
            const callerSnap = await getDb()
                .collection('users')
                .doc(request.auth.uid)
                .get();
            if (callerSnap.data()?.role !== 'admin') {
                throw new https_1.HttpsError('permission-denied', 'Chỉ admin mới gửi thông báo cho người khác.');
            }
        }
        await writeNotification(recipientId, payload);
        return { ok: true };
    }
    catch (err) {
        rethrowHttps(err);
    }
});
//# sourceMappingURL=index.js.map