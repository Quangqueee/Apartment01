import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

    return [
        {
            url: `${baseUrl}`, // Trang chủ
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 1,
        },
        {
            url: `${baseUrl}/about`, // Trang giới thiệu
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/apartments`, // Trang danh sách căn hộ
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/ctv-register`, // Trang đăng ký CTV
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/huong-dan-cong-viec`, // Trang hướng dẫn
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ]
}