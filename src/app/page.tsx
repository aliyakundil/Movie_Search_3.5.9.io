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

// Серверная функция для получения фильмов
async function getMovies(): Promise<Movie[]> {
  const apiKey = process.env.TMDB_API_KEY; // ключ из .env.local
  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=return`,
    { next: { revalidate: 3600 } } // кеш на 1 час
  );
  const data = await res.json();
  return data.results;
}

export default async function Home() {
  const movies = await getMovies();
  return (
    <div className="flex justify-center">
      <div className="max-w-5xl w-full flex flex-col items-center">
        <MovieCards movies={movies} />
      </div>
    </div>
  );
}
