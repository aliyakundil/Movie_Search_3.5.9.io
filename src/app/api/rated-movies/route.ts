import { NextResponse } from "next/server";

const ratedMovies: any[] = [];

export async function POST(req: Request) {
  const data = await req.json();

  // обновляем или добавляем фильм с рейтингом
  const index = ratedMovies.findIndex(f => f.id === data.movieId);
  if (index !== -1) {
    ratedMovies[index] = { ...ratedMovies[index], value: data.value };
  } else {
    ratedMovies.push({ ...data });
  }
  return NextResponse.json({ message: "Rating saved", ratedMovies });
}

export async function GET() {
  return NextResponse.json(ratedMovies);
}
