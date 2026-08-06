"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
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
} from "firebase/firestore";
import { firestore } from "@/firebase/server-init";
import { createApartment, updateApartment, getApartmentById } from "@/lib/data";
import { Apartment } from "@/lib/types";
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

const landlordSubmissionSchema = z.object({
  title: z.string().min(5),
  roomType: z.enum(["studio", "1n1k", "2n1k", "other"]),
  district: z.string().min(1),
  area: z.coerce.number().min(1, "Diện tích phải lớn hơn 0."),
  price: z.coerce.number().min(0),
  details: z.string().min(20),
  buildingNotes: z.string().optional(),
  commission: z.string().optional(),
  contactPhone: z.string().min(8, "Số điện thoại không hợp lệ."),
  status: z.enum(["available", "rented"]).optional(), // Đã bổ sung status
  imageUrls: z
    .array(z.string().trim().min(1))
    .min(1, "Cần ít nhất 1 hình ảnh.")
    .max(MAX_APARTMENT_IMAGES, `Tối đa ${MAX_APARTMENT_IMAGES} hình ảnh.`),
});

export async function submitApartmentByLandlord(
  uid: string,
  values: z.infer<typeof landlordSubmissionSchema>,
  apartmentId?: string // Đã bổ sung đối số thứ 3
) {
  if (!uid) return { error: "User not authenticated." };

  const validatedFields = landlordSubmissionSchema.safeParse(values);
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

    // XỬ LÝ NẾU LÀ CẬP NHẬT (Có apartmentId)
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
        buildingNotes: data.buildingNotes || "",
        commission: data.commission || "",
        contactPhone: data.contactPhone || "",
        status: data.status || "available",
        imageUrls: data.imageUrls,
        updatedAt: Timestamp.now(),
      } as Partial<Apartment>);

      revalidatePath(`/${ADMIN_PATH}/submissions`);
      revalidatePath(`/profile/apartments`);
      return { success: true, apartmentId };
    }

    // XỬ LÝ NẾU LÀ TẠO MỚI TIN ĐĂNG
    const newApartmentData = {
      ...data,
      sourceCode: "",
      address: data.district,
      landlordPhoneNumber: data.contactPhone,
      status: data.status || "available",
      submissionStatus: "pending" as const,
      landlordId: uid,
      listingSummary: "",
      tags: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const newApartment = await createApartment(
      newApartmentData as Omit<Apartment, "id">,
    );

    await notifyAdminsServer({
      title: "Tin đăng mới cần duyệt",
      message: `Chủ nhà vừa gửi tin đăng "${data.title}" (${data.district}) chờ duyệt.`,
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
  seoTitle: z.string().optional(), // Bổ sung SEO Title
  listingSummary: z.string().optional(), // Bổ sung SEO Content
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

    await updateApartment(apartmentId, {
      ...validatedUpdates.data,
      submissionStatus: decision,
      updatedAt: Timestamp.now(),
    } as Partial<Apartment>);

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
    revalidatePath(`/${ADMIN_PATH}`);
    revalidatePath("/");
    if (decision === "published") {
      revalidatePath(`/apartments/${apartmentId}`);
    }

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

    // Sắp xếp mới nhất lên đầu
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
        // BỔ SUNG: Ánh xạ luôn Timestamp nằm ẩn bên trong aiContent
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

    // Sắp xếp bài đăng mới nhất lên đầu
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
      // Push lên đầu ngay lập tức theo đúng ý bạn
      updatedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    });
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
      createdAt: Timestamp.now(), // Đẩy lên đầu danh sách chính
    });
    return { success: true };
  } catch (error) {
    console.error("Error approving push:", error);
    return { error: "Lỗi khi phê duyệt đẩy tin." };
  }
}
