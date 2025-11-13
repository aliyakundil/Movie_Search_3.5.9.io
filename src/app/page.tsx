import { NextRequest, NextResponse } from "next/server";
import MovieCards from "./components/MovieCards";

type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
};

type MovieResponse = {
  results: Movie[];
};

type FetchResult = {
  movies: Movie[];
  errorMessage: string | null;
  pages: number;
  query: string;
};

// Серверная функция для получения фильмов
async function getMovies(): Promise<FetchResult> {
  const apiKey = process.env.TMDB_API_KEY; // ключ из .env.local
  let errorMessage: string | null = null;
  let movies: Movie[] = [];
  let pages: number = 0;
  const query: string = "return";
  const page = 1;

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}&page=${page}`,
      { next: { revalidate: 3600 } } // кеш на 1 час
    );

    if (!res.ok) {
      errorMessage = `Ошибка: ${res.status} ${res.statusText}`;
    } else {
      const data = await res.json();
      movies = data.results ?? [];
      pages = data.total_pages ?? 0;
    }
  } catch (err) {
    console.error(err);
    errorMessage = `Не удалось получить данные с MovieDB`;
  }

  return { movies, pages, query, errorMessage };
}

export default async function Home() {
  const { movies, errorMessage, pages, query } = await getMovies();
  return (
    <div className="flex justify-center">
      <div className="max-w-5xl w-full flex flex-col items-center">
        <MovieCards
          movies={movies}
          serverError={errorMessage}
          pages={pages}
          searchQuery={query}
        />
      </div>
    </div>
  );
}
