"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { deleteObject, ref as storageRef } from "firebase/storage";
import { db, storage } from "@/firebase";
import { generateSearchKeywords } from "@/lib/utils";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import { ADMIN_PATH } from "@/lib/constants";
import type { AiContent, ApartmentStatus, RoomType } from "@/lib/types";

export const SHORT_TERM_COLLECTION = "short_term_apartments";

export type AdminShortTermWriteInput = {
  title: string;
  sourceCode: string;
  roomType: RoomType;
  district: string;
  area: number;
  nightlyPrice: number; // VND / đêm
  minNights: number;
  maxGuests: number;
  checkInTime: string;
  checkOutTime: string;
  amenities: string[];
  blockedDates: string[];
  details: string;
  address: string;
  landlordPhoneNumber: string;
  status?: ApartmentStatus;
  imageUrls: string[];
  aiContent?: AiContent | null;
};

export type LandlordShortTermWriteInput = {
  title: string;
  roomType: RoomType;
  district: string;
  area: number;
  nightlyPrice: number;
  minNights: number;
  maxGuests: number;
  checkInTime: string;
  checkOutTime: string;
  amenities: string[];
  blockedDates: string[];
  details: string;
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

/** Admin tạo/sửa căn ngắn hạn — publish ngay. */
export async function saveAdminShortTermClient(
  input: AdminShortTermWriteInput,
  apartmentId?: string,
): Promise<{ id: string }> {
  try {
    const payload = {
      title: input.title,
      sourceCode: input.sourceCode,
      roomType: input.roomType,
      district: input.district,
      area: input.area,
      nightlyPrice: input.nightlyPrice,
      minNights: input.minNights,
      maxGuests: input.maxGuests,
      checkInTime: input.checkInTime,
      checkOutTime: input.checkOutTime,
      amenities: input.amenities,
      blockedDates: input.blockedDates,
      details: input.details,
      address: input.address,
      landlordPhoneNumber: input.landlordPhoneNumber,
      status: input.status || "available",
      imageUrls: input.imageUrls,
      aiContent: input.aiContent ?? null,
      searchKeywords: searchText([
        input.title,
        input.address,
        input.sourceCode,
      ]),
      updatedAt: serverTimestamp(),
    };

    if (apartmentId) {
      await updateDoc(doc(db, SHORT_TERM_COLLECTION, apartmentId), payload);
      return { id: apartmentId };
    }

    const created = await addDoc(collection(db, SHORT_TERM_COLLECTION), {
      ...payload,
      submissionStatus: "published",
      createdAt: serverTimestamp(),
    });
    return { id: created.id };
  } catch (error) {
    console.error("saveAdminShortTermClient:", error);
    throw error;
  }
}

/** Chủ nhà gửi/sửa căn ngắn hạn — luôn ở trạng thái pending chờ admin duyệt. */
export async function saveLandlordShortTermClient(
  uid: string,
  input: LandlordShortTermWriteInput,
  apartmentId?: string,
): Promise<{ id: string }> {
  try {
    const payload = {
      title: input.title,
      roomType: input.roomType,
      district: input.district,
      area: input.area,
      nightlyPrice: input.nightlyPrice,
      minNights: input.minNights,
      maxGuests: input.maxGuests,
      checkInTime: input.checkInTime,
      checkOutTime: input.checkOutTime,
      amenities: input.amenities,
      blockedDates: input.blockedDates,
      details: input.details,
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
      await updateDoc(doc(db, SHORT_TERM_COLLECTION, apartmentId), {
        ...payload,
        submissionStatus: "pending",
      });
      return { id: apartmentId };
    }

    const created = await addDoc(collection(db, SHORT_TERM_COLLECTION), {
      ...payload,
      sourceCode: "",
      submissionStatus: "pending",
      landlordId: uid,
      createdAt: serverTimestamp(),
    });

    await notifyAdmins({
      title: "Tin căn hộ ngắn hạn mới",
      message: `Chủ nhà vừa gửi tin căn hộ ngắn hạn "${input.title}" chờ duyệt.`,
      type: "new_submission",
      link: `/${ADMIN_PATH}/submissions`,
    });

    return { id: created.id };
  } catch (error) {
    console.error("saveLandlordShortTermClient:", error);
    throw error;
  }
}

export async function deleteShortTermApartmentClient(
  apartmentId: string,
  imageUrls?: string[],
) {
  try {
    await tryDeleteImages(imageUrls);
    await deleteDoc(doc(db, SHORT_TERM_COLLECTION, apartmentId));
  } catch (error) {
    console.error("deleteShortTermApartmentClient:", error);
    throw error;
  }
}

/** Admin duyệt/từ chối tin căn ngắn hạn do chủ nhà gửi. */
export async function reviewShortTermSubmissionClient(
  apartmentId: string,
  action: "publish" | "reject",
  adminNotes?: string,
  adminFields?: {
    sourceCode?: string;
    address?: string;
    landlordPhoneNumber?: string;
  },
) {
  try {
    const snap = await getDoc(doc(db, SHORT_TERM_COLLECTION, apartmentId));
    const data = snap.data();
    await updateDoc(doc(db, SHORT_TERM_COLLECTION, apartmentId), {
      submissionStatus: action === "publish" ? "published" : "rejected",
      adminNotes: adminNotes || "",
      ...(adminFields?.sourceCode !== undefined && {
        sourceCode: adminFields.sourceCode,
      }),
      ...(adminFields?.address !== undefined && {
        address: adminFields.address,
      }),
      ...(adminFields?.landlordPhoneNumber !== undefined && {
        landlordPhoneNumber: adminFields.landlordPhoneNumber,
      }),
      updatedAt: serverTimestamp(),
    });
    if (data?.landlordId) {
      await createNotification({
        recipientId: data.landlordId,
        title:
          action === "publish"
            ? "Tin căn hộ ngắn hạn được duyệt"
            : "Tin căn hộ ngắn hạn bị từ chối",
        message:
          action === "publish"
            ? `Tin "${data.title}" đã được đăng công khai.`
            : `Tin "${data.title}" chưa được duyệt.${adminNotes ? ` Lý do: ${adminNotes}` : ""}`,
        type: "submission_reviewed",
        link: "/profile/apartments",
      });
    }
    return { success: true as const };
  } catch (error) {
    console.error("reviewShortTermSubmissionClient:", error);
    return { error: "Không thể cập nhật trạng thái tin đăng." };
  }
}
