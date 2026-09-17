"use server";

import { z } from "zod";
import { db } from "@/firebase/index";
import { revalidatePath } from "next/cache";
import { revalidateApartmentListings } from "@/lib/apartment-cache";
import {
  doc,
  getDoc,
  updateDoc,
  deleteField,
  Timestamp,
  orderBy,
  query,
  collection,
  where,
  getDocs,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "@/firebase/server-init";
import { createApartment, updateApartment, getApartmentById } from "@/lib/data";
import { Apartment, LandlordApartmentInput } from "@/lib/types";
import { ADMIN_PATH, MAX_APARTMENT_IMAGES } from "@/lib/constants";
import {
  createNotificationServer,
  notifyAdminsServer,
} from "@/lib/notifications-server";

async function assertIsAdmin(uid: string | undefined): Promise<boolean> {
  if (!uid) return false;
  try {
    const userDoc = await getDoc(doc(firestore, "users", uid));
    if (!userDoc.exists()) return false;
    return userDoc.data().role === "admin";
  } catch (error) {
    console.error("Error checking admin access (landlord-actions):", error);
    return false;
  }
}

// --- 1. Landlord registration request ---

const landlordRequestSchema = z.object({
  displayName: z.string().min(1, "Vui lòng nhập họ tên."),
  phoneNumber: z.string().min(8, "Số điện thoại không hợp lệ."),
  district: z.string().min(1, "Vui lòng chọn khu vực."),
  message: z.string().optional(),
});

export async function createLandlordRequest(
  uid: string,
  values: z.infer<typeof landlordRequestSchema>,
) {
  if (!uid) return { error: "User not authenticated." };

  const validatedFields = landlordRequestSchema.safeParse(values);
  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    return { error: `Invalid fields! ${errorMessage}` };
  }

  try {
    await updateDoc(doc(firestore, "users", uid), {
      landlordApprovalStatus: "pending",
      landlordRequestData: validatedFields.data,
      landlordRequestSubmittedAt: Timestamp.now(),
    });

    await notifyAdminsServer({
      title: "Yêu cầu đăng ký chủ nhà mới",
      message: `${validatedFields.data.displayName} vừa gửi yêu cầu trở thành chủ nhà (khu vực ${validatedFields.data.district}).`,
      type: "landlord_request",
      link: `/${ADMIN_PATH}/partners`,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to create landlord request:", error);
    return { error: "Không thể gửi yêu cầu. Vui lòng thử lại." };
  }
}

// --- 2. Admin approves/rejects landlord requests ---

export async function approveLandlord(adminUid: string, targetUid: string) {
  const isAdmin = await assertIsAdmin(adminUid);
  if (!isAdmin) return { error: "Not authorized." };
  return approveOrRejectLandlord(targetUid, "approved");
}

export async function rejectLandlord(
  adminUid: string,
  targetUid: string,
  reason?: string,
) {
  const isAdmin = await assertIsAdmin(adminUid);
  if (!isAdmin) return { error: "Not authorized." };
  return approveOrRejectLandlord(targetUid, "rejected", reason);
}

async function approveOrRejectLandlord(
  uid: string,
  decision: "approved" | "rejected",
  reason?: string,
) {
  if (!uid) return { error: "Missing user id." };

  try {
    if (decision === "approved") {
      await updateDoc(doc(firestore, "users", uid), {
        role: "landlord",
        landlordApprovalStatus: "approved",
      });
    } else {
      await updateDoc(doc(firestore, "users", uid), {
        landlordApprovalStatus: "rejected",
        landlordRejectionReason: reason ?? deleteField(),
      });
    }

    await createNotificationServer({
      recipientId: uid,
      title:
        decision === "approved"
          ? "Yêu cầu chủ nhà đã được duyệt"
          : "Yêu cầu chủ nhà bị từ chối",
      message:
        decision === "approved"
          ? "Bạn đã được duyệt làm chủ nhà và có thể đăng tin căn hộ để admin xét duyệt."
          : reason || "Yêu cầu đăng ký chủ nhà của bạn đã bị từ chối.",
      type: decision === "approved" ? "landlord_approved" : "landlord_rejected",
      link: "/submit-apartment",
    });

    revalidatePath(`/${ADMIN_PATH}/partners`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to ${decision} landlord:`, error);
    return { error: "Không thể cập nhật trạng thái. Vui lòng thử lại." };
  }
}

// --- 3. Landlord submits an apartment for review ---

const highlightsSchema = z.preprocess((value) => {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}, z.array(z.string()));

const landlordSubmissionSchema = z.object({
  title: z.string().min(5),
  roomType: z.enum([
    "studio",
    "1n1k",
    "2n1k",
    "3n1k",
    "4n1k",
    "duplex",
    "penthouse",
    "other",
  ]),
  district: z.string().min(1),
  area: z.coerce.number().min(1, "Diện tích phải lớn hơn 0."),
  price: z.coerce.number().min(0),
  details: z.string().min(20),
  commission: z.string().optional(),
  contactPhone: z.string().min(8, "Số điện thoại không hợp lệ."),
  status: z.enum(["available", "rented"]).optional(),
  imageUrls: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .refine(
          (url) => !url.startsWith("blob:") && !url.startsWith("data:"),
          "Ảnh chưa được tải lên máy chủ.",
        ),
    )
    .min(1, "Cần ít nhất 1 hình ảnh.")
    .max(MAX_APARTMENT_IMAGES, `Tối đa ${MAX_APARTMENT_IMAGES} hình ảnh.`),
  // ĐỒNG BỘ DATA FLOW: Cấu trúc aiContent chuẩn
  aiContent: z.object({
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    description: z.string().optional(),
    highlights: highlightsSchema,
  }).nullable().optional(),
});

export async function submitApartmentByLandlord(
  uid: string,
  payload: LandlordApartmentInput,
  apartmentId?: string
) {
  if (!uid) return { error: "User not authenticated." };

  // FIX: Thay `values` thành `payload`
  const validatedFields = landlordSubmissionSchema.safeParse(payload);
  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    return { error: `Invalid fields! ${errorMessage}` };
  }

  try {
    const userDoc = await getDoc(doc(firestore, "users", uid));
    if (!userDoc.exists() || userDoc.data().role !== "landlord") {
      return { error: "Chỉ chủ nhà đã được duyệt mới có thể đăng tin." };
    }

    const data = validatedFields.data;

    if (apartmentId) {
      const existing = await getApartmentById(apartmentId);
      if (!existing || existing.landlordId !== uid) {
        return { error: "Không tìm thấy căn hộ hoặc không có quyền truy cập." };
      }

      await updateApartment(apartmentId, {
        title: data.title,
        roomType: data.roomType,
        district: data.district,
        area: data.area,
        price: data.price,
        details: data.details,
        commission: data.commission || "",
        contactPhone: data.contactPhone || "",
        status: data.status || "available",
        imageUrls: data.imageUrls,
        aiContent: data.aiContent || null, // Đóng gói đúng chuẩn
        updatedAt: Timestamp.now(),
      } as Partial<Apartment>);

      revalidatePath(`/${ADMIN_PATH}/submissions`);
      revalidatePath(`/profile/apartments`);
      return { success: true, apartmentId };
    }

    const newApartmentData = {
      title: data.title,
      roomType: data.roomType,
      district: data.district,
      area: data.area,
      price: data.price,
      details: data.details,
      commission: data.commission,
      contactPhone: data.contactPhone,
      imageUrls: data.imageUrls,
      sourceCode: "",
      address: data.district,
      landlordPhoneNumber: data.contactPhone,
      status: data.status || "available",
      submissionStatus: "pending" as const,
      landlordId: uid,
      aiContent: data.aiContent || null, // KHÔNG DÙNG listingSummary rời rạc
      tags: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const newApartment = await createApartment(
      newApartmentData as Omit<Apartment, "id">,
    );

    await notifyAdminsServer({
      title: "Tin đăng mới cần duyệt",
      message: `Chủ nhà vừa gửi tin đăng "${data.title}" - ${data.district} chờ duyệt.`,
      type: "new_submission",
      link: `/${ADMIN_PATH}/submissions`,
    });

    revalidatePath(`/${ADMIN_PATH}/submissions`);
    return { success: true, apartmentId: newApartment.id };
  } catch (error) {
    console.error("Failed to submit apartment by landlord:", error);
    return { error: "Không thể gửi tin đăng. Vui lòng thử lại." };
  }
}

// --- 4. Admin reviews a pending submission ---

const reviewUpdatesSchema = z.object({
  sourceCode: z.string().optional(),
  address: z.string().optional(),
  landlordPhoneNumber: z.string().optional(),
  adminNotes: z.string().optional(),
  // ĐỒNG BỘ DATA FLOW: Zod Schema cho dữ liệu SEO từ phía Admin
  aiContent: z.object({
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    description: z.string().optional(),
    highlights: highlightsSchema,
  }).optional(),
}).partial();

export async function reviewApartmentSubmission(
  adminUid: string,
  apartmentId: string,
  decision: "published" | "rejected",
  updates?: z.infer<typeof reviewUpdatesSchema>,
) {
  const isAdmin = await assertIsAdmin(adminUid);
  if (!isAdmin) return { error: "Not authorized." };
  if (!apartmentId) return { error: "Missing apartment id." };

  const validatedUpdates = reviewUpdatesSchema.safeParse(updates ?? {});
  if (!validatedUpdates.success) {
    return { error: "Invalid review data." };
  }

  try {
    const apartment = await getApartmentById(apartmentId);
    if (!apartment) return { error: "Apartment not found." };

    const updateData: Partial<Apartment> = {
      ...validatedUpdates.data,
      submissionStatus: decision,
      updatedAt: Timestamp.now(),
    };

    await updateApartment(apartmentId, updateData);

    if (apartment.landlordId) {
      await createNotificationServer({
        recipientId: apartment.landlordId,
        title:
          decision === "published"
            ? "Tin đăng của bạn đã được duyệt"
            : "Tin đăng của bạn bị từ chối",
        message:
          validatedUpdates.data.adminNotes ||
          (decision === "published"
            ? `Tin đăng "${apartment.title}" đã được đăng công khai.`
            : `Tin đăng "${apartment.title}" đã bị từ chối.`),
        type: "submission_reviewed",
        link:
          decision === "published" ? `/apartments/${apartmentId}` : "/submit-apartment",
      });
    }

    revalidatePath(`/${ADMIN_PATH}/submissions`);
    await revalidateApartmentListings(
      decision === "published" ? apartmentId : undefined,
    );

    return { success: true };
  } catch (error) {
    console.error("Failed to review apartment submission:", error);
    return { error: "Không thể cập nhật tin đăng. Vui lòng thử lại." };
  }
}

// --- 5. Admin fetches pending submissions ---

export async function getPendingSubmissionsAction(adminUid: string) {
  const isAdmin = await assertIsAdmin(adminUid);
  if (!isAdmin) return { error: "Not authorized.", apartments: [] };

  try {
    const q = query(
      collection(firestore, "apartments"),
      where("submissionStatus", "==", "pending"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    const apartments = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt
          ? { seconds: data.createdAt.seconds, nanoseconds: data.createdAt.nanoseconds }
          : null,
        updatedAt: data.updatedAt
          ? { seconds: data.updatedAt.seconds, nanoseconds: data.updatedAt.nanoseconds }
          : null,
      };
    }) as unknown as Apartment[];

    return { apartments };
  } catch (error) {
    console.error("Failed to fetch pending submissions:", error);
    return { error: "Không thể tải danh sách chờ duyệt.", apartments: [] };
  }
}

// --- 6. Admin fetches ALL partners (pending & approved) ---
export async function getPartnersAction(adminUid: string) {
  const isAdmin = await assertIsAdmin(adminUid);
  if (!isAdmin) return { error: "Not authorized.", partners: [] };

  try {
    const q = query(
      collection(firestore, "users"),
      where("landlordApprovalStatus", "in", ["pending", "approved", "rejected"])
    );
    const snapshot = await getDocs(q);
    const partners = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        role: data.role,
        status: data.landlordApprovalStatus,
        ...data.landlordRequestData,
        submittedAt: data.landlordRequestSubmittedAt
          ? { seconds: data.landlordRequestSubmittedAt.seconds, nanoseconds: data.landlordRequestSubmittedAt.nanoseconds }
          : null,
      };
    });

    partners.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));

    return { partners };
  } catch (error) {
    console.error("Failed to fetch partners:", error);
    return { error: "Không thể tải danh sách đối tác.", partners: [] };
  }
}

// --- 7. Admin fetches statistics for a specific landlord ---
export async function getLandlordApartmentStats(adminUid: string, landlordId: string) {
  const isAdmin = await assertIsAdmin(adminUid);
  if (!isAdmin) return { error: "Not authorized." };

  try {
    const q = query(
      collection(firestore, "apartments"),
      where("landlordId", "==", landlordId)
    );
    const snapshot = await getDocs(q);

    let pending = 0;
    let published = 0;
    let rejected = 0;

    snapshot.forEach((doc) => {
      const status = doc.data().submissionStatus;
      if (status === "pending") pending++;
      else if (status === "published") published++;
      else if (status === "rejected") rejected++;
    });

    return { stats: { pending, published, rejected, total: snapshot.size } };
  } catch (error) {
    console.error("Failed to fetch landlord stats:", error);
    return { error: "Lỗi lấy thống kê căn hộ." };
  }
}

// --- 8. Admin fetches specific partner details ---
export async function getPartnerByIdAction(adminUid: string, partnerId: string) {
  const isAdmin = await assertIsAdmin(adminUid);
  if (!isAdmin) return { error: "Not authorized.", partner: null };

  try {
    const docRef = doc(firestore, "users", partnerId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { error: "Không tìm thấy đối tác.", partner: null };

    const data = docSnap.data();
    return {
      partner: {
        id: docSnap.id,
        email: data.email,
        role: data.role,
        status: data.landlordApprovalStatus,
        ...data.landlordRequestData,
        submittedAt: data.landlordRequestSubmittedAt
          ? { seconds: data.landlordRequestSubmittedAt.seconds, nanoseconds: data.landlordRequestSubmittedAt.nanoseconds }
          : null,
      }
    };
  } catch (error) {
    console.error("Failed to fetch partner:", error);
    return { error: "Lỗi tải thông tin đối tác.", partner: null };
  }
}

// --- 9. Admin fetches all apartments by a specific landlord ---
export async function getLandlordApartmentsAction(adminUid: string, landlordId: string) {
  const isAdmin = await assertIsAdmin(adminUid);
  if (!isAdmin) return { error: "Not authorized.", apartments: [] };

  try {
    const q = query(
      collection(firestore, "apartments"),
      where("landlordId", "==", landlordId)
    );
    const snapshot = await getDocs(q);
    const apartments = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt
          ? { seconds: data.createdAt.seconds, nanoseconds: data.createdAt.nanoseconds }
          : null,
        updatedAt: data.updatedAt
          ? { seconds: data.updatedAt.seconds, nanoseconds: data.updatedAt.nanoseconds }
          : null,
        aiContent: data.aiContent
          ? {
            ...data.aiContent,
            updatedAt: data.aiContent.updatedAt
              ? { seconds: data.aiContent.updatedAt.seconds, nanoseconds: data.aiContent.updatedAt.nanoseconds }
              : null
          }
          : null
      };
    });

    apartments.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    return { apartments };
  } catch (error) {
    console.error("Failed to fetch landlord apartments:", error);
    return { error: "Không thể tải danh sách căn hộ.", apartments: [] };
  }
}

// 10. Chủ nhà gửi yêu cầu push -> Đẩy lên đầu ngay lập tức và đánh dấu cờ
export async function requestPushApartmentAction(uid: string, apartmentId: string) {
  if (!uid) return { error: "Chưa đăng nhập." };
  try {
    const docRef = doc(firestore, "apartments", apartmentId);
    await updateDoc(docRef, {
      isPushRequested: true,
      pushRequestedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    });
    await revalidateApartmentListings(apartmentId);
    return { success: true };
  } catch (error) {
    console.error("Error requesting push:", error);
    return { error: "Không thể gửi yêu cầu đẩy tin." };
  }
}

// 11. Admin xác nhận / xử lý xong yêu cầu push (tắt cờ)
export async function clearPushRequestAction(adminUid: string, apartmentId: string) {
  const isAdmin = await assertIsAdmin(adminUid);
  if (!isAdmin) return { error: "Không có quyền quản trị." };

  try {
    const docRef = doc(firestore, "apartments", apartmentId);
    await updateDoc(docRef, {
      isPushRequested: false,
      pushRequestedAt: deleteField()
    });
    return { success: true };
  } catch (error) {
    console.error("Error clearing push request:", error);
    return { error: "Lỗi xử lý yêu cầu." };
  }
}

export async function approveAndResolvePushAction(adminUid: string, apartmentId: string) {
  const isAdmin = await assertIsAdmin(adminUid);
  if (!isAdmin) return { error: "Không có quyền quản trị." };

  try {
    const docRef = doc(firestore, "apartments", apartmentId);
    await updateDoc(docRef, {
      isPushRequested: false,
      pushRequestedAt: deleteField(),
      updatedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    });
    await revalidateApartmentListings(apartmentId);
    return { success: true };
  } catch (error) {
    console.error("Error approving push:", error);
    return { error: "Lỗi khi phê duyệt đẩy tin." };
  }
}

export async function approveAndResolvePushBatchAction(
  adminUid: string,
  apartmentIds: string[],
) {
  const isAdmin = await assertIsAdmin(adminUid);
  if (!isAdmin) return { error: "Không có quyền quản trị." };
  if (!apartmentIds?.length) return { error: "Chưa chọn căn hộ nào." };

  const uniqueIds = Array.from(new Set(apartmentIds.filter(Boolean)));
  if (uniqueIds.length === 0) return { error: "Chưa chọn căn hộ nào." };
  if (uniqueIds.length > 500) return { error: "Tối đa 500 căn hộ mỗi lần duyệt." };

  try {
    const now = Date.now();
    const CHUNK = 450;
    for (let i = 0; i < uniqueIds.length; i += CHUNK) {
      const chunk = uniqueIds.slice(i, i + CHUNK);
      const batch = writeBatch(firestore);
      chunk.forEach((id, chunkIndex) => {
        const globalIndex = i + chunkIndex;
        const ts = Timestamp.fromMillis(now + (uniqueIds.length - globalIndex));
        batch.update(doc(firestore, "apartments", id), {
          isPushRequested: false,
          pushRequestedAt: deleteField(),
          updatedAt: ts,
          createdAt: ts,
        });
      });
      await batch.commit();
    }
    await revalidateApartmentListings();
    return { success: true, pushedCount: uniqueIds.length };
  } catch (error) {
    console.error("Error approving batch push:", error);
    return { error: "Lỗi khi phê duyệt đẩy tin hàng loạt." };
  }
}

// --- 13. Ngưng hợp tác: Xóa toàn bộ căn hộ của đối tác và hạ quyền tài khoản về user ---
export async function terminatePartnershipAction(adminUid: string, targetUid: string) {
  const isAdmin = await assertIsAdmin(adminUid);
  if (!isAdmin) return { error: "Không có quyền quản trị." };
  if (!targetUid) return { error: "Thiếu ID đối tác." };

  try {
    const apartmentsQuery = query(
      collection(firestore, "apartments"),
      where("landlordId", "==", targetUid)
    );
    const snapshot = await getDocs(apartmentsQuery);

    const deletePromises = snapshot.docs.map(async (aptDoc) => {
      await deleteDoc(doc(firestore, "apartments", aptDoc.id));
    });
    await Promise.all(deletePromises);

    const userRef = doc(firestore, "users", targetUid);
    await updateDoc(userRef, {
      role: "user",
      landlordApprovalStatus: "rejected",
      landlordRejectionReason: "Hợp tác đã bị chấm dứt và thu hồi bởi Quản trị viên.",
      landlordRequestData: deleteField(),
      landlordRequestSubmittedAt: deleteField(),
    });

    await createNotificationServer({
      recipientId: targetUid,
      title: "Hợp tác đã bị chấm dứt",
      message: "Tư cách chủ nhà của bạn đã bị thu hồi và toàn bộ tin đăng căn hộ đã được gỡ bỏ bởi quản trị viên.",
      type: "landlord_rejected",
      link: "/",
    });

    revalidatePath(`/${ADMIN_PATH}/partners`);
    await revalidateApartmentListings();

    return { success: true, deletedApartmentsCount: snapshot.size };
  } catch (error) {
    console.error("Failed to terminate partnership:", error);
    return { error: "Không thể ngưng hợp tác và xóa dữ liệu đối tác. Vui lòng thử lại." };
  }
}

// --- 14. Chủ nhà tự đổi trạng thái nhanh ngoài danh sách ---
export async function updateLandlordApartmentStatusAction(
  landlordId: string,
  apartmentId: string,
  newStatus: "available" | "rented"
) {
  try {
    if (!landlordId || !apartmentId) {
      return { error: "Thiếu thông tin xác thực hoặc mã căn hộ." };
    }

    // FIX: Sử dụng `firestore` từ server-init thay vì `db`
    const apartmentRef = doc(firestore, "apartments", apartmentId);
    const docSnap = await getDoc(apartmentRef);

    if (!docSnap.exists()) {
      return { error: "Không tìm thấy dữ liệu căn hộ." };
    }

    const apartmentData = docSnap.data();

    // Kiểm tra quyền sở hữu
    if (apartmentData?.landlordId !== landlordId) {
      return { error: "Bạn không có quyền chỉnh sửa căn hộ này." };
    }

    // Cập nhật trạng thái
    await updateDoc(apartmentRef, {
      status: newStatus,
      updatedAt: Timestamp.now(), // Đồng bộ kiểu dữ liệu Timestamp
    });

    const statusText = newStatus === "available" ? "Còn trống" : "Tạm hết";
    await notifyAdminsServer({
      title: "Chủ nhà cập nhật trạng thái phòng",
      message: `Căn hộ "${apartmentData.address || apartmentData.title}" (Mã: ${apartmentData.sourceCode || apartmentId}) vừa được đổi trạng thái thành: ${statusText}.`,
      type: "system",
      link: `/${ADMIN_PATH}/apartments`,
    });

    revalidatePath("/profile/apartments");
    revalidatePath(`/${ADMIN_PATH}/apartments`);

    return { success: true };
  } catch (error: any) {
    console.error("Lỗi cập nhật trạng thái phòng:", error);
    return { error: error.message || "Không thể cập nhật trạng thái phòng lúc này." };
  }
}