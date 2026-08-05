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
      priority: 1,
    },
    {
      url: `${baseUrl}/about`, // Trang giới thiệu — xác nhận route này tồn tại thật
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/apartments`, // Trang danh sách căn hộ
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/huong-dan-cong-viec`, // Trang hướng dẫn
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Đã bỏ /ctv-register khỏi sitemap để nhất quán với robots.ts (đã disallow route này)
  ]

  return [...staticEntries, ...apartmentEntries]
}