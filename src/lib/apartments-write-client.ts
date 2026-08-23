"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { deleteObject, ref as storageRef } from "firebase/storage";
import { db, storage } from "@/firebase";
import { generateSearchKeywords } from "@/lib/utils";
import { notifyAdmins } from "@/lib/notifications";
import { ADMIN_PATH } from "@/lib/constants";
import type { AiContent, ApartmentStatus, FeatureTag, RoomType } from "@/lib/types";

export type AdminApartmentWriteInput = {
  title: string;
  sourceCode: string;
  roomType: RoomType;
  district: string;
  area: number;
  price: number;
  commission?: string | number;
  details: string;
  aiContent?: AiContent | null;
  address: string;
  landlordPhoneNumber: string;
  status?: ApartmentStatus;
  tags?: FeatureTag[];
  imageUrls: string[];
};

export type LandlordApartmentWriteInput = {
  title: string;
  roomType: RoomType;
  district: string;
  area: number;
  price: number;
  details: string;
  commission?: string | number;
  contactPhone: string;
  status?: ApartmentStatus;
  imageUrls: string[];
  aiContent?: AiContent | null;
};

function searchText(parts: Array<string | undefined>) {
  return generateSearchKeywords(parts.filter(Boolean).join(" ").trim());
}

async function tryDeleteImages(imageUrls: string[] | undefined) {
  if (!imageUrls?.length) return;
  await Promise.all(
    imageUrls.map(async (url) => {
      try {
        await deleteObject(storageRef(storage, url));
      } catch (error) {
        console.error("Không xóa được ảnh Storage:", error);
      }
    }),
  );
}

/** Ghi apartments bằng Auth hiện tại trên browser — Server Action không có request.auth. */
export async function saveAdminApartmentClient(
  input: AdminApartmentWriteInput,
  apartmentId?: string,
): Promise<{ id: string }> {
  try {
    const payload = {
      title: input.title,
      sourceCode: input.sourceCode,
      roomType: input.roomType,
      district: input.district,
      area: input.area,
      price: input.price,
      commission: input.commission ?? "",
      details: input.details,
      aiContent: input.aiContent ?? null,
      address: input.address,
      landlordPhoneNumber: input.landlordPhoneNumber,
      status: input.status || "available",
      tags: input.tags || [],
      imageUrls: input.imageUrls,
      searchKeywords: searchText([
        input.title,
        input.address,
        input.sourceCode,
      ]),
      updatedAt: serverTimestamp(),
    };

    if (apartmentId) {
      await updateDoc(doc(db, "apartments", apartmentId), payload);
      return { id: apartmentId };
    }

    const created = await addDoc(collection(db, "apartments"), {
      ...payload,
      submissionStatus: "published",
      createdAt: serverTimestamp(),
    });
    return { id: created.id };
  } catch (error) {
    console.error("saveAdminApartmentClient:", error);
    throw error;
  }
}

export async function saveLandlordApartmentClient(
  uid: string,
  input: LandlordApartmentWriteInput,
  apartmentId?: string,
): Promise<{ id: string }> {
  try {
    const payload = {
      title: input.title,
      roomType: input.roomType,
      district: input.district,
      area: input.area,
      price: input.price,
      details: input.details,
      commission: input.commission ?? "",
      contactPhone: input.contactPhone,
      status: input.status || "available",
      imageUrls: input.imageUrls,
      aiContent: input.aiContent ?? null,
      address: input.district,
      landlordPhoneNumber: input.contactPhone,
      searchKeywords: searchText([input.title, input.district]),
      updatedAt: serverTimestamp(),
    };

    if (apartmentId) {
      await updateDoc(doc(db, "apartments", apartmentId), payload);
      return { id: apartmentId };
    }

    const created = await addDoc(collection(db, "apartments"), {
      ...payload,
      sourceCode: "",
      submissionStatus: "pending",
      landlordId: uid,
      tags: [],
      createdAt: serverTimestamp(),
    });
    return { id: created.id };
  } catch (error) {
    console.error("saveLandlordApartmentClient:", error);
    throw error;
  }
}

export async function deleteApartmentClient(
  apartmentId: string,
  imageUrls?: string[],
) {
  try {
    await tryDeleteImages(imageUrls);
    await deleteDoc(doc(db, "apartments", apartmentId));
  } catch (error) {
    console.error("deleteApartmentClient:", error);
    throw error;
  }
}

const BATCH_LIMIT = 400;

async function commitChunkedUpdates(
  ids: string[],
  build: (id: string, index: number) => Record<string, unknown>,
) {
  for (let i = 0; i < ids.length; i += BATCH_LIMIT) {
    const chunk = ids.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    chunk.forEach((id, offset) => {
      batch.update(doc(db, "apartments", id), build(id, i + offset));
    });
    await batch.commit();
  }
}

/** Admin đẩy tin lên đầu: ghi createdAt + updatedAt = now (đúng sort trang chủ). */
export async function pushApartmentClient(apartmentId: string) {
  try {
    const now = Timestamp.now();
    await updateDoc(doc(db, "apartments", apartmentId), {
      updatedAt: now,
      createdAt: now,
    });
    return { success: true as const };
  } catch (error) {
    console.error("pushApartmentClient:", error);
    return { error: "Không thể đẩy căn hộ lên đầu." };
  }
}

export async function pushApartmentsBatchClient(apartmentIds: string[]) {
  try {
    const uniqueIds = Array.from(new Set(apartmentIds.filter(Boolean)));
    if (uniqueIds.length === 0) return { error: "Chưa chọn căn hộ nào." };
    const now = Date.now();
    await commitChunkedUpdates(uniqueIds, (_id, index) => {
      const ts = Timestamp.fromMillis(now + (uniqueIds.length - index));
      return { updatedAt: ts, createdAt: ts };
    });
    return { success: true as const, pushedCount: uniqueIds.length };
  } catch (error) {
    console.error("pushApartmentsBatchClient:", error);
    return { error: "Không thể đẩy hàng loạt căn hộ." };
  }
}

export async function requestPushApartmentClient(apartmentId: string) {
  try {
    const now = Timestamp.now();
    await updateDoc(doc(db, "apartments", apartmentId), {
      isPushRequested: true,
      pushRequestedAt: now,
      updatedAt: now,
      createdAt: now,
    });
    const snap = await getDoc(doc(db, "apartments", apartmentId));
    const title = snap.data()?.title || apartmentId;
    await notifyAdmins({
      title: "Yêu cầu đẩy tin",
      message: `Chủ nhà yêu cầu đẩy tin "${title}" lên đầu trang.`,
      type: "system",
      link: `/${ADMIN_PATH}/apartments`,
    });
    return { success: true as const };
  } catch (error) {
    console.error("requestPushApartmentClient:", error);
    return { error: "Không thể gửi yêu cầu đẩy tin." };
  }
}

export async function approveAndResolvePushClient(apartmentId: string) {
  try {
    const now = Timestamp.now();
    await updateDoc(doc(db, "apartments", apartmentId), {
      isPushRequested: false,
      pushRequestedAt: deleteField(),
      updatedAt: now,
      createdAt: now,
    });
    return { success: true as const };
  } catch (error) {
    console.error("approveAndResolvePushClient:", error);
    return { error: "Lỗi khi phê duyệt đẩy tin." };
  }
}

export async function approveAndResolvePushBatchClient(apartmentIds: string[]) {
  try {
    const uniqueIds = Array.from(new Set(apartmentIds.filter(Boolean)));
    if (uniqueIds.length === 0) return { error: "Chưa chọn căn hộ nào." };
    const now = Date.now();
    await commitChunkedUpdates(uniqueIds, (_id, index) => {
      const ts = Timestamp.fromMillis(now + (uniqueIds.length - index));
      return {
        isPushRequested: false,
        pushRequestedAt: deleteField(),
        updatedAt: ts,
        createdAt: ts,
      };
    });
    return { success: true as const, pushedCount: uniqueIds.length };
  } catch (error) {
    console.error("approveAndResolvePushBatchClient:", error);
    return { error: "Lỗi khi phê duyệt đẩy tin hàng loạt." };
  }
}

export async function updateLandlordApartmentStatusClient(
  landlordId: string,
  apartmentId: string,
  newStatus: "available" | "rented",
) {
  try {
    const snap = await getDoc(doc(db, "apartments", apartmentId));
    const apartmentData = snap.data();
    if (apartmentData?.landlordId && apartmentData.landlordId !== landlordId) {
      return { error: "Bạn không có quyền chỉnh sửa căn hộ này." };
    }
    await updateDoc(doc(db, "apartments", apartmentId), {
      status: newStatus,
      updatedAt: Timestamp.now(),
    });
    const statusText = newStatus === "available" ? "Còn trống" : "Tạm hết";
    await notifyAdmins({
      title: "Chủ nhà cập nhật trạng thái phòng",
      message: `Căn hộ "${apartmentData?.address || apartmentData?.title || apartmentId}" vừa đổi trạng thái thành: ${statusText}.`,
      type: "system",
      link: `/${ADMIN_PATH}/apartments`,
    });
    return { success: true as const };
  } catch (error: any) {
    console.error("updateLandlordApartmentStatusClient:", error);
    return { error: error.message || "Không thể cập nhật trạng thái phòng." };
  }
}

export async function backfillSubmissionStatusClient() {
  try {
    const snapshot = await getDocs(collection(db, "apartments"));
    const missing = snapshot.docs.filter((d) => !d.data().submissionStatus);
    await commitChunkedUpdates(
      missing.map((d) => d.id),
      () => ({ submissionStatus: "published" }),
    );
    return { success: true as const, updatedCount: missing.length };
  } catch (error) {
    console.error("backfillSubmissionStatusClient:", error);
    return { error: "Không thể backfill trạng thái tin đăng." };
  }
}

export async function listUnmigratedAiApartmentsClient() {
  try {
    const snapshot = await getDocs(collection(db, "apartments"));
    const unmigrated: { id: string; aptData: any }[] = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const hasAiContent = data.aiContent && data.aiContent.description;
      const hasLegacyRootData =
        !!data.listingSummary || !!data.seoTitle || !!data.seoDescription;
      if (!hasAiContent || hasLegacyRootData) {
        unmigrated.push({
          id: docSnap.id,
          aptData: {
            ...data,
            title: data.title || "Căn hộ cho thuê",
            roomType: data.roomType || "studio",
            district: data.district || "Hà Nội",
            address: data.address || "",
            price: data.price || 0,
            area: data.area || 0,
            detailedInformation: data.details || "",
          },
        });
      }
    }
    return { success: true as const, data: unmigrated };
  } catch (error) {
    console.error("listUnmigratedAiApartmentsClient:", error);
    return { error: "Không thể lấy danh sách căn hộ chưa tối ưu AI." };
  }
}

export async function applyAiMigrationClient(
  apartmentId: string,
  aiContent: AiContent,
  clearLegacyRoot = false,
) {
  try {
    const payload: Record<string, unknown> = {
      aiContent: {
        ...aiContent,
        updatedAt: Timestamp.now(),
      },
    };
    if (clearLegacyRoot) {
      payload.listingSummary = deleteField();
      payload.seoTitle = deleteField();
      payload.seoDescription = deleteField();
      payload.highlights = deleteField();
    }
    await updateDoc(doc(db, "apartments", apartmentId), payload);
    return { success: true as const };
  } catch (error) {
    console.error("applyAiMigrationClient:", error);
    return { error: "Không ghi được nội dung AI." };
  }
}

export async function migrateSearchKeywordsBatchClient(
  batch: { id: string; textToSearch: string }[],
) {
  try {
    await Promise.all(
      batch.map((item) =>
        updateDoc(doc(db, "apartments", item.id), {
          searchKeywords: generateSearchKeywords(item.textToSearch),
        }),
      ),
    );
    return { success: true as const };
  } catch (error) {
    console.error("migrateSearchKeywordsBatchClient:", error);
    return { error: "Lỗi đồng bộ lô dữ liệu." };
  }
}

