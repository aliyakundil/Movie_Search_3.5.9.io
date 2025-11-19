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
  Rate,
} from "antd";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import debounce from "lodash/debounce";
import { useFilter } from "../context/FilterContext";

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
  //  Гостевой режим
  const [guestSession, setGuestSession] = useState<string | null>(null);

  /* начальное значение состояние для спиннера */
  const [mounted, setMounted] = useState(false);

  /* Пагинация */
  const [currentPageSearch, setCurrentPageSearch] = useState(1);
  const [currentPageRated, setCurrentPageRated] = useState(1);
  const [query, setQuery] = useState(searchQuery);
  const [loading, setLoading] = useState(false);
  const pageSize = 6;
  const pageSizeRated = 6;

  /* ошибка */
  const [error, setError] = useState<string | null>(null);

  // Рейтинг
  const [rating, setRating] = useState<Record<number, number>>({});
  const [color, setColor] = useState<Record<number, string>>({});

  // Состояние для активного фильтра
  const { activeFilter, setActiveFilter } = useFilter();

  // Пагинация для вкладки Rated
  const ratedMovies = moviesList.filter((movie) => rating[movie.id] > 0);
  const totalPagesRated = Math.ceil(ratedMovies.length / pageSize);

  // Список фильмов с рейтингом
  const [ratedMoviesState, setRatedMoviesState] = useState<Movie[]>([]);

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
      setCurrentPageSearch(1);
      setCurrentPageRated(1);
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

  const handlePageChangeSearch = (page: number) => {
    setCurrentPageSearch(page);
    fetchMovies(page, query);
  };

  const handlePageChangeRated = (page: number) => {
    setCurrentPageRated(page);
    fetchMovies(page, query);
  };

  const paginatedRatedMovies = ratedMovies.slice(
    (currentPageRated - 1) * pageSize,
    currentPageRated * pageSize
  );

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

  // Гостевой режим
  useEffect(() => {
    const initGuestSession = async () => {
      try {
        const resSession = await fetch("/api/guest-session"); // эндпоинт для создания гостя
        const dataSession = await resSession.json();

        console.log("Response text:", dataSession);

        if (dataSession.guest_session_id) {
          setGuestSession(dataSession.guest_session_id);
          console.log("Сессия инициализирована", dataSession.guest_session_id);
        } else {
          console.error("Не удалось создать гостевой сеанс");
        }
      } catch (err) {
        console.error("Ошибка при инициализации гостевогого сенса", err);
      }
    };

    initGuestSession();
  }, []);

  // Рейтинг
  const handlRatingChange = (movieId: number, value: number) => {
    setRating((prev) => ({ ...prev, [movieId]: value }));
    let color: string = "#66E900";
    if (value <= 3) color = "#E90000";
    else if (value <= 5) color = "#E97E00";
    else if (value <= 7) color = "#E9D100";
    else color = "#66E900";

    setColor((prev) => ({ ...prev, [movieId]: color }));
  };

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
        <Text
          className={`flex flex-col items-center cursor-pointer ${
            activeFilter === "search" ? "text-blue-500" : "text-gray-500"
          }`}
          onClick={() => setActiveFilter("search")}
        >
          {" "}
          Search
          <div
            className={`w-10 h-[2px] mt-1 ${
              activeFilter === "search" ? "bg-blue-500" : "bg-gray-200"
            }`}
          />
        </Text>

        <Text
          className={`flex flex-col items-center cursor-pointer ${
            activeFilter === "rated" ? "text-blue-500" : "text-gray-500"
          }`}
          onClick={() => setActiveFilter("rated")}
        >
          Rated
          <div
            className={`w-10 h-[2px] mt-1 ${
              activeFilter === "rated" ? "bg-blue-500" : "bg-gray-200"
            }`}
          />
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
          {moviesList
            .filter((movie) => {
              if (activeFilter === "search") return true;
              if (activeFilter === "rated") return rating[movie.id] > 0;
              return true;
            })
            .map((movie) => (
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
                      <span className="text-xl font-semibold">
                        {movie.title}
                      </span>
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
                    <Rate
                      className="custom-rate"
                      count={10}
                      onChange={(value) => handlRatingChange(movie.id, value)}
                      value={rating[movie.id] || 0}
                      style={{ color: color[movie.id] }}
                    />
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}

      {activeFilter === "search" && (
        <div className="mt-8 mb-8">
          <Pagination
            current={currentPageSearch}
            total={totalPages * pageSize}
            pageSize={pageSize}
            onChange={handlePageChangeSearch}
            showSizeChanger={false}
          />
        </div>
      )}

      {activeFilter === "rated" && (
        <div className="mt-8 mb-8">
          <Pagination
            current={currentPageRated}
            total={totalPagesRated * pageSizeRated}
            pageSize={pageSizeRated}
            onChange={handlePageChangeRated}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
}

export default MovieCards;
