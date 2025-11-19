import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY;

  const res = await fetch(
    `https://api.themoviedb.org/3/authentication/guest_session/new?api_key=${apiKey}`
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Не удалось создать гостевой сеанс" },
      { status: 500 }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
