import { MetadataRoute } from 'next'
import { collection, getDocs } from 'firebase/firestore'
import { firestore } from '@/firebase/server-init'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hanoiresidence.site'

// Lấy danh sách căn hộ từ Firestore để build URL động cho từng trang chi tiết
async function getApartmentEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const snapshot = await getDocs(collection(firestore, 'apartments'))

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      const lastModified =
        data.updatedAt?.toDate?.() ?? data.createdAt?.toDate?.() ?? new Date()

      return {
        url: `${baseUrl}/apartments/${doc.id}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.9, // Ưu tiên cao vì đây là trang chuyển đổi (conversion page)
      }
    })
  } catch (error) {
    // Nếu fetch Firestore lỗi lúc build, không để sập toàn bộ sitemap —
    // trả về mảng rỗng, các trang tĩnh bên dưới vẫn được tạo bình thường
    console.error('Lỗi khi lấy danh sách căn hộ cho sitemap:', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apartmentEntries = await getApartmentEntries()

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl, // Trang chủ
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1, // Ưu tiên tuyệt đối
    },
    {
      url: `${baseUrl}/apartments`, // Trang danh sách căn hộ
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`, // Trang giới thiệu
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/partner-register`, // Trang ký gửi/đăng tin căn hộ (SEO để hút chủ nhà)
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/huong-dan-cong-viec`, // Trang hướng dẫn công việc cho nhân viên (SEO để hút nhân viên)
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  return [...staticEntries, ...apartmentEntries]
}