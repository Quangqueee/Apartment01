import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    // Ghép baseUrl với đuôi sitemap.xml
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}