import MovieCards from "./components/MovieCards";
import { FilterProvider } from "./context/FilterContext";

type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: [];
};

type Genre = {
  id: number;
  name: string;
};

type FetchResult = {
  movies: Movie[];
  errorMessage: string | null;
  pages: number;
  query: string;
};

type FetchResultGenres = {
  errorGenre: string | null;
  genres: Genre[];
};

const apiKey = process.env.TMDB_API_KEY; // ключ из .env.local

// Серверная функция для получения фильмов
async function getMovies(): Promise<FetchResult> {
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

async function getGenres(): Promise<FetchResultGenres> {
  let genres: Genre[] = [];
  let errorGenre: string | null = null;

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}` // кеш на 1 час
    );

    if (!res.ok) {
      errorGenre = `Ошибка: ${res.status} ${res.statusText}`;
    } else {
      const data = await res.json();
      genres = data.genres ?? [];
    }
  } catch (err) {
    console.error(err);
    errorGenre = `Не удалось получить жанры`;
  }

  return { genres, errorGenre };
}

export default async function Home() {
  const { movies, errorMessage, pages, query } = await getMovies();
  const { genres, errorGenre } = await getGenres();
  return (
    <div className="flex justify-center">
      <div className="max-w-5xl w-full flex flex-col items-center">
        <FilterProvider>
          <MovieCards
            movies={movies}
            serverError={errorMessage}
            pages={pages}
            searchQuery={query}
            genres={genres}
            errorGenre={errorGenre}
          />
        </FilterProvider>
      </div>
    </div>
  );
}
