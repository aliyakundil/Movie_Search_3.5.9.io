import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.TMDB_API_KEY;
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "return";
  const page = searchParams.get("page") || "1";

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}&page=${page}`
    );

    if (!res.ok) {
      return NextResponse.json(
        { errorMessage: `TMDB Error: ${res.status} ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      movies: data.results ?? [],
      total_pages: data.total_pages ?? 0,
    });
  } catch {
    return NextResponse.json(
      { errorMessage: "Не удалось получить данные с MovieDB" },
      { status: 500 }
    );
  }
}
