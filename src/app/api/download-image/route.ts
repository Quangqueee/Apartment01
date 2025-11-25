// src/app/api/download-image/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing image URL', { status: 400 });
  }

  try {
    // Fetch the image from the original URL (e.g., Firebase Storage)
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    // Get the image data as a Blob
    const blob = await imageResponse.blob();

    // Get the original content type
    const contentType = imageResponse.headers.get('content-type') || 'application/octet-stream';

    // Create a new response with the image data and correct headers
    // This effectively proxies the image through our server, avoiding CORS issues.
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="image.jpg"`, // Suggest a filename
      },
    });
  } catch (error) {
    console.error('Image download proxy error:', error);
    return new NextResponse('Failed to download image', { status: 500 });
  }
}
