import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Fallback nên là domain thật, KHÔNG dùng localhost
  // để tránh sitemap trỏ sai nếu thiếu env var lúc deploy production
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hanoiresidence.site' || 'http://localhost:9002';

  return {
    rules: [
      {
        // Áp dụng cho tất cả bot thông thường (Googlebot, Bingbot, ...)
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',          // API routes - không cần index
          '/ctv-register',  // Trang đăng ký CTV - không phải nội dung khách hàng tìm kiếm
          '/admin',         // Nếu có khu vực quản trị/dashboard nội bộ
        ],
      },
      {
        // Khai báo tường minh cho các bot AI (ChatGPT, Perplexity, Claude...)
        // để chủ động kiểm soát việc AI đọc & trích dẫn nội dung site
        userAgent: ['GPTBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'CCBot'],
        allow: '/',
        disallow: ['/api/', '/ctv-register', '/admin'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}