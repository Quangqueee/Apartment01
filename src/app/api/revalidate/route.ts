import { NextResponse } from "next/server";
import { revalidateApartmentListings } from "@/lib/apartment-cache";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "REVALIDATE_SECRET is not configured." },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-revalidate-secret");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : headerSecret;
  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let apartmentId: string | undefined;
  try {
    const body = (await request.json()) as { apartmentId?: string | null };
    apartmentId = body.apartmentId || undefined;
  } catch {
    apartmentId = undefined;
  }

  try {
    await revalidateApartmentListings(apartmentId, { skipRemote: true });
    return NextResponse.json({ revalidated: true, apartmentId: apartmentId ?? null });
  } catch (error) {
    console.error("revalidate API:", error);
    return NextResponse.json(
      { error: "Không thể làm mới cache." },
      { status: 500 },
    );
  }
}
