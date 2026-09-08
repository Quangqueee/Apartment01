"use client";

import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import { ADMIN_PATH } from "@/lib/constants";
import type { Apartment, SubmissionStatus } from "@/lib/types";

function stampOf(value: any) {
  if (!value) return null;
  if (typeof value.seconds === "number") {
    return { seconds: value.seconds, nanoseconds: value.nanoseconds || 0 };
  }
  if (typeof value.toMillis === "function") {
    const ms = value.toMillis() as number;
    return {
      seconds: Math.floor(ms / 1000),
      nanoseconds: (ms % 1000) * 1e6,
    };
  }
  return null;
}

export async function createLandlordRequestClient(
  uid: string,
  values: {
    displayName: string;
    phoneNumber: string;
    district: string;
    message?: string;
  },
) {
  try {
    await updateDoc(doc(db, "users", uid), {
      landlordApprovalStatus: "pending",
      landlordRequestData: values,
      landlordRequestSubmittedAt: Timestamp.now(),
    });
    await notifyAdmins({
      title: "Yêu cầu đăng ký chủ nhà mới",
      message: `${values.displayName} vừa gửi yêu cầu trở thành chủ nhà (khu vực ${values.district}).`,
      type: "landlord_request",
      link: `/${ADMIN_PATH}/partners`,
    });
    return { success: true as const };
  } catch (error) {
    console.error("createLandlordRequestClient:", error);
    return { error: "Không thể gửi yêu cầu. Vui lòng thử lại." };
  }
}

export async function approveLandlordClient(targetUid: string) {
  try {
    await updateDoc(doc(db, "users", targetUid), {
      role: "landlord",
      landlordApprovalStatus: "approved",
    });
    await createNotification({
      recipientId: targetUid,
      title: "Yêu cầu chủ nhà đã được duyệt",
      message:
        "Bạn đã được duyệt làm chủ nhà và có thể đăng tin căn hộ để admin xét duyệt.",
      type: "landlord_approved",
      link: "/submit-apartment",
    });
    return { success: true as const };
  } catch (error) {
    console.error("approveLandlordClient:", error);
    return { error: "Không thể cập nhật trạng thái. Vui lòng thử lại." };
  }
}

export async function rejectLandlordClient(targetUid: string, reason?: string) {
  try {
    await updateDoc(doc(db, "users", targetUid), {
      landlordApprovalStatus: "rejected",
      landlordRejectionReason: reason ?? deleteField(),
    });
    await createNotification({
      recipientId: targetUid,
      title: "Yêu cầu chủ nhà bị từ chối",
      message: reason || "Yêu cầu đăng ký chủ nhà của bạn đã bị từ chối.",
      type: "landlord_rejected",
      link: "/submit-apartment",
    });
    return { success: true as const };
  } catch (error) {
    console.error("rejectLandlordClient:", error);
    return { error: "Không thể cập nhật trạng thái. Vui lòng thử lại." };
  }
}

export async function reviewApartmentSubmissionClient(
  apartmentId: string,
  decision: Extract<SubmissionStatus, "published" | "rejected">,
  updates: {
    sourceCode?: string;
    address?: string;
    landlordPhoneNumber?: string;
    adminNotes?: string;
  },
) {
  try {
    const snap = await getDoc(doc(db, "apartments", apartmentId));
    if (!snap.exists()) return { error: "Apartment not found." };
    const apartment = snap.data();
    await updateDoc(doc(db, "apartments", apartmentId), {
      ...updates,
      submissionStatus: decision,
      updatedAt: Timestamp.now(),
    });
    if (apartment.landlordId) {
      await createNotification({
        recipientId: apartment.landlordId,
        title:
          decision === "published"
            ? "Tin đăng của bạn đã được duyệt"
            : "Tin đăng của bạn bị từ chối",
        message:
          updates.adminNotes ||
          (decision === "published"
            ? `Tin đăng "${apartment.title}" đã được đăng công khai.`
            : `Tin đăng "${apartment.title}" đã bị từ chối.`),
        type: "submission_reviewed",
        link:
          decision === "published"
            ? `/apartments/${apartmentId}`
            : "/submit-apartment",
      });
    }
    return { success: true as const };
  } catch (error) {
    console.error("reviewApartmentSubmissionClient:", error);
    return { error: "Không thể cập nhật tin đăng. Vui lòng thử lại." };
  }
}

export async function fetchPendingSubmissionsClient() {
  try {
    const q = query(
      collection(db, "apartments"),
      where("submissionStatus", "==", "pending"),
      orderBy("createdAt", "desc"),
    );
    const snapshot = await getDocs(q);
    const apartments = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: stampOf(data.createdAt),
        updatedAt: stampOf(data.updatedAt),
      };
    }) as unknown as Apartment[];
    return { apartments };
  } catch (error) {
    console.error("fetchPendingSubmissionsClient:", error);
    return { error: "Không thể tải danh sách chờ duyệt.", apartments: [] as Apartment[] };
  }
}

export async function fetchPartnersClient() {
  try {
    const q = query(
      collection(db, "users"),
      where("landlordApprovalStatus", "in", ["pending", "approved", "rejected"]),
    );
    const snapshot = await getDocs(q);
    const partners = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        email: data.email,
        role: data.role,
        status: data.landlordApprovalStatus,
        ...data.landlordRequestData,
        submittedAt: stampOf(data.landlordRequestSubmittedAt),
      };
    });
    partners.sort(
      (a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0),
    );
    return { partners };
  } catch (error) {
    console.error("fetchPartnersClient:", error);
    return { error: "Không thể tải danh sách đối tác.", partners: [] as any[] };
  }
}

export async function fetchLandlordApartmentStatsClient(landlordId: string) {
  try {
    const q = query(
      collection(db, "apartments"),
      where("landlordId", "==", landlordId),
    );
    const snapshot = await getDocs(q);
    let pending = 0;
    let published = 0;
    let rejected = 0;
    snapshot.forEach((d) => {
      const status = d.data().submissionStatus;
      if (status === "pending") pending += 1;
      else if (status === "published") published += 1;
      else if (status === "rejected") rejected += 1;
    });
    return { stats: { pending, published, rejected, total: snapshot.size } };
  } catch (error) {
    console.error("fetchLandlordApartmentStatsClient:", error);
    return { error: "Lỗi lấy thống kê căn hộ." };
  }
}

export async function fetchPartnerByIdClient(partnerId: string) {
  try {
    const docSnap = await getDoc(doc(db, "users", partnerId));
    if (!docSnap.exists()) {
      return { error: "Không tìm thấy đối tác.", partner: null };
    }
    const data = docSnap.data();
    return {
      partner: {
        id: docSnap.id,
        email: data.email,
        role: data.role,
        status: data.landlordApprovalStatus,
        ...data.landlordRequestData,
        submittedAt: stampOf(data.landlordRequestSubmittedAt),
      },
    };
  } catch (error) {
    console.error("fetchPartnerByIdClient:", error);
    return { error: "Lỗi tải thông tin đối tác.", partner: null };
  }
}

export async function fetchLandlordApartmentsClient(landlordId: string) {
  try {
    const q = query(
      collection(db, "apartments"),
      where("landlordId", "==", landlordId),
    );
    const snapshot = await getDocs(q);
    const apartments = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: stampOf(data.createdAt),
        updatedAt: stampOf(data.updatedAt),
        aiContent: data.aiContent
          ? {
              ...data.aiContent,
              updatedAt: stampOf(data.aiContent.updatedAt),
            }
          : null,
      };
    });
    apartments.sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
    );
    return { apartments };
  } catch (error) {
    console.error("fetchLandlordApartmentsClient:", error);
    return { error: "Không thể tải danh sách căn hộ.", apartments: [] as any[] };
  }
}

export async function terminatePartnershipClient(targetUid: string) {
  try {
    const q = query(
      collection(db, "apartments"),
      where("landlordId", "==", targetUid),
    );
    const snapshot = await getDocs(q);
    await Promise.all(
      snapshot.docs.map((apt) => deleteDoc(doc(db, "apartments", apt.id))),
    );
    await updateDoc(doc(db, "users", targetUid), {
      role: "user",
      landlordApprovalStatus: "rejected",
      landlordRejectionReason:
        "Hợp tác đã bị chấm dứt và thu hồi bởi Quản trị viên.",
      landlordRequestData: deleteField(),
      landlordRequestSubmittedAt: deleteField(),
    });
    await createNotification({
      recipientId: targetUid,
      title: "Hợp tác đã bị chấm dứt",
      message:
        "Tư cách chủ nhà của bạn đã bị thu hồi và toàn bộ tin đăng căn hộ đã được gỡ bỏ bởi quản trị viên.",
      type: "landlord_rejected",
      link: "/",
    });
    return { success: true as const, deletedApartmentsCount: snapshot.size };
  } catch (error) {
    console.error("terminatePartnershipClient:", error);
    return {
      error:
        "Không thể ngưng hợp tác và xóa dữ liệu đối tác. Vui lòng thử lại.",
    };
  }
}
