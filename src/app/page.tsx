import Image from "next/image";
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
}


// Серверная функция для получения фильмов
async function getMovies(): Promise<FetchResult> {
  const apiKey = process.env.TMDB_API_KEY; // ключ из .env.local
  let errorMessage: string | null = null;
  let movies: Movie[] = [];
  
  try {
      const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=return`,
      { next: { revalidate: 3600 } } // кеш на 1 час
    );

    if(!res.ok) {
      errorMessage = `Ошибка: ${res.status} ${res.statusText}`;
    } else {
      const data = await res.json();
      movies = data.results ?? [];
    }
  } catch(err) {
    console.error(err);
    errorMessage = `Не удалось получить данные с MovieDB`
  }

  return { movies, errorMessage}
}

export default async function Home() {
  const { movies, errorMessage } = await getMovies();
  return (
    <div className="flex justify-center">
      <div className="max-w-5xl w-full flex flex-col items-center">
        <MovieCards movies={movies} serverError={errorMessage} />
      </div>
    </div>
  );
}
