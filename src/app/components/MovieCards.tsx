"use client";
import {
  Pagination,
  Input,
  Select,
  Space,
  Typography,
  Card,
  Tag,
  Spin,
  Alert,
} from "antd";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import debounce from "lodash/debounce";

const { Text } = Typography;

type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
};

type Props = {
  movies: Movie[];
  serverError?: string | null;
  pages: number;
  searchQuery: string;
};

const { Search } = Input;
const { Option } = Select;

function MovieCards({ movies, serverError, pages, searchQuery }: Props) {
  const [moviesList, setMovies] = useState<Movie[]>(movies);
  const [totalPages, setTotalPages] = useState(pages);

  /* начальное значение состояние для спиннера */
  const [mounted, setMounted] = useState(false);

  /* Пагинация */
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState(searchQuery);
  const [loading, setLoading] = useState(false);
  const pageSize = 6;

  /* ошибка */
  const [error, setError] = useState<string | null>(null);

  const fetchMovies = async (page: number, searchQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/movies?query=${searchQuery}&page=${page}`);

      console.log("Response object:", res); // весь объект Response
      console.log("Status:", res.status); // HTTP статус
      console.log("OK:", res.ok); // true если статус 200–299
      console.log("Headers:", res.headers); // заголовки ответа

      const data = await res.json();
      if (data.errorMessage) setError(data.errorMessage);
      else {
        setMovies(data.movies);
        setTotalPages(data.total_pages);
      }
    } catch {
      setError("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  };

  // Используем debounce для поиска
  const debouncedFetch = useCallback(
    debounce((value: string) => {
      setCurrentPage(1);
      fetchMovies(1, value);
    }, 500),
    []
  );

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (!query) return;
    debouncedFetch(query);
  }, [query]);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchMovies(page, query);
  };

  useEffect(() => {
    // компонент полностью смонтирован на клиенте
    setMounted(true);
  }, []);

  // обработка потери интернета
  useEffect(() => {
    function handleOffline() {
      setError("Отсутсвует подключение к интернету");
    }

    function handleOnline() {
      setError(null);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // если связь с инетрентом оборвалась
    if (!navigator.onLine) {
      setError("Отсутсвует подключение к интернету");
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (serverError || error) {
    return (
      <div className="flex justify-center items-center mt-10">
        <Alert
          message="Ошибка"
          description={serverError || error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (!mounted) {
    // Пока компонента нет показываем спиннер
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-white z-50">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 mt-8">
      <Space size="large">
        <Text className="flex flex-col items-center cursor-pointer">
          Search
          <div className="w-10 h-[2px] bg-blue-500 mt-1"></div>
        </Text>

        <Text className="flex flex-col items-center cursor-pointer">
          Rated
          <div className="w-10 h-[1px] bg-gray-200 mt-1"></div>
        </Text>
      </Space>

      {/* Поиск */}
      <Input.Search
        placeholder="Type to search"
        size="large"
        // value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* Сетка карточек */}
      {moviesList.length === 0 ? (
        <div className="w-full text-center mt-4 text-lg text-gray-500">
          К сожалению, такого фильма нет!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
          {moviesList.map((movie) => (
            <Card hoverable key={movie.id}>
              <div className="movie-card flex gap-6 rounded-xl w-[451px]">
                <div className="flex-shrink-0">
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                      alt={movie.title}
                      className="w-[183px] h-[281px] object-cover"
                    />
                  ) : (
                    <div className="w-[183px] h-[281px] flex items-center justify-center bg-gray-200 text-gray-500">
                      No Image
                    </div>
                  )}
                </div>
                <div className="movie-info flex flex-col justify-start p-3">
                  <div className="movie-title flex items-center justify-between mb-2">
                    <span className="text-xl font-semibold">{movie.title}</span>
                    <Tag className="vote">{movie.vote_average}</Tag>
                  </div>
                  <div className="movie-release_date text-gray-600 mb-2">
                    {movie.release_date
                      ? format(new Date(movie.release_date), "MMMM d, yyyy")
                      : "No date"}
                  </div>
                  <div className="movie-overview text-sm font-light">
                    {movie.overview}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 mb-8">
        <Pagination
          current={currentPage}
          total={totalPages * pageSize}
          pageSize={pageSize}
          onChange={handlePageChange}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
}

export default MovieCards;
