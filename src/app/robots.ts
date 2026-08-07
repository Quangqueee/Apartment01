import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Chỉ cần 1 fallback cứng tới domain production là đủ an toàn
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hanoiresidence.site';

  // Danh sách các route không cần index (tiết kiệm crawl budget)
  const disallowRoutes = [
    '/api/',              // API routes
    '/ctv-register',      // Trang đăng ký CTV cũ
    '/partner-register',  // Trang đăng ký đối tác mới
    '/admin/',            // Khu vực quản trị
    '/login',             // Các trang Auth & Cá nhân
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/profile',
    '/favorites',
  ];

  return {
    rules: [
      {
        // Áp dụng cho tất cả bot thông thường (Googlebot, Bingbot, ...)
        userAgent: '*',
        allow: '/',
        disallow: disallowRoutes,
      },
      {
        // Kiểm soát các bot AI (ChatGPT, Perplexity, Claude...)
        userAgent: ['GPTBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'CCBot'],
        allow: '/',
        disallow: disallowRoutes,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}