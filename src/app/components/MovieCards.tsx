"use client";
import {
  Pagination,
  Input,
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
import debounce from 'lodash/debounce';
import { useFilter } from "../context/FilterContext";
import { truncateText } from "@/utils/truncateText";

const { Text } = Typography;

type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: [];
  value?: number; // для локального рейтинга
};

type Genre = {
  id: number;
  name: string;
};

type Props = {
  movies: Movie[];
  serverError?: string | null;
  pages: number;
  searchQuery: string;
  genres: Genre[];
  errorGenre: string | null;
};

type RatedMovie = Movie & {
  value: number;
};

function MovieCards({
  movies,
  serverError,
  pages,
  searchQuery,
  genres,
}: Props) {
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

  // Состояние для активного фильтра
  const { activeFilter, setActiveFilter } = useFilter();

  // Список фильмов с рейтингом
  const [ratedMoviesState, setRatedMoviesState] = useState<Movie[]>([]);

  // Для отслеживания загрузки рейтинга и ошибок
  const [ratingLoading, setRatingLoading] = useState<Record<number, boolean>>(
    {}
  );
  const [ratingError, setRatingError] = useState<Record<number, string>>({});

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
    setError(null);
    setLoading(true);

    if (!query) return;
    debouncedFetch(query || "");
  }, [query]);

  const handlePageChangeSearch = (page: number) => {
    setCurrentPageSearch(page);
    fetchMovies(page, query);
  };

  const handlePageChangeRated = (page: number) => {
    setCurrentPageRated(page);
  };

  // Пагинация для вкладки Rated
  const totalPagesRated = Math.ceil(ratedMoviesState.length / pageSizeRated);
  const paginatedRatedMovies = ratedMoviesState.slice(
    (currentPageRated - 1) * pageSizeRated,
    currentPageRated * pageSizeRated
  );

  // Фильтр по рейтингу
  const moviesToRender =
    activeFilter === "search" ? moviesList : paginatedRatedMovies;

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

  // Функция для отправки API рейтинга
  const submitRating = async (movie: Movie, value: number) => {
    if (!guestSession) {
      setRatingError((prev) => ({
        ...prev,
        [movie.id]: "Нет сессии пользователя",
      }));
      return;
    }

    setRatingLoading((prev) => ({ ...prev, [movie.id]: true }));
    setRatingError((prev) => ({ ...prev, [movie.id]: "" }));

    try {
      const res = await fetch("/api/rated-movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...movie, value }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Ошибка при сохранении рейтинга");
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error("Ошибка при отправке рейтинга", err.message);
      } else {
        console.error("Неизвестная ошибка", err);
      }
    } finally {
      setRatingLoading((prev) => ({ ...prev, [movie.id]: false }));
    }
  };

  // получение данный с API
  useEffect(() => {
    if (!query) return;

    const fetchRatedMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/rated-movies");
        if (!res.ok) throw new Error("Ошибка загрузки Rated фильмов");
        const data = await res.json();
        console.log("Передаем:", data);

        setRatedMoviesState(data);

        const ratingMap: Record<number, number> = {};
        data.forEach((m: RatedMovie) => (ratingMap[m.id] = m.value ?? 0));
        setRating(ratingMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRatedMovies();
  }, [activeFilter]);

  useEffect(() => {
    const ratingMap: Record<number, number> = {};
    ratedMoviesState.forEach((m) => {
      ratingMap[m.id] = m.value ?? 0;
    });
    setRating(ratingMap);
  }, [ratedMoviesState]);

  // Рейтинг
  const handleRatingChange = (movie: Movie, movieId: number, value: number) => {
    // 1. Обновляем локальный рейтинг
    setRating((prev) => ({ ...prev, [movieId]: value }));

    // 2. Добавляем в список Rated фильмов, если ещё нет
    setRatedMoviesState((prev) => {
      const exists = prev.find((m) => m.id === movieId);
      if (exists) {
        return prev.map((m) => (m.id === movieId ? { ...m, value } : m));
      } else {
        return [...prev, { ...movie, value }];
      }
    });

    // 3. Отправляем на API
    submitRating(movie, value);
    console.log("Отправка рейтинга:", movie, value);
  };

  const getBorderColor = (rating: number) => {
    let color: string = "#66E900";
    if (rating < 3) color = "#E90000";
    else if (rating < 5) color = "#E97E00";
    else if (rating < 7) color = "#E9D100";
    else if (rating >= 7) color = "#66E900";
    return color;
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

  if (!mounted || loading) {
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
      {activeFilter === "search" ? (
        <Input.Search
          placeholder="Type to search"
          size="large"
          // value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      ) : null}

      {/* Сетка карточек */}
      {loading ? (
        <div className="flex justify-center items-center w-full h-[300px]">
          <Spin size="large" />
        </div>
      ) : moviesList.length === 0 ? (
        <div className="w-full text-center mt-4 text-lg text-gray-500">
          К сожалению, такого фильма нет!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
          {moviesToRender.map((movie) => (
            <Card hoverable key={movie.id}>
              <div className="movie-card flex gap-3 rounded-xl w-[451px]">
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
                    <Tag
                      className="vote"
                      style={{
                        border: `2px solid ${getBorderColor(movie.vote_average)}`,
                      }}
                    >
                      {movie.vote_average.toFixed(1)}
                    </Tag>
                  </div>
                  <div className="movie-release_date text-gray-600 mb-2">
                    {movie.release_date
                      ? format(new Date(movie.release_date), "MMMM d, yyyy")
                      : "No date"}
                  </div>
                  <div className="movie-genre">
                    {movie.genre_ids.map((id) => {
                      const genre = genres.find((g) => g.id === id);
                      return (
                        <span
                          className="w-[37px] h-[15px] text-[#000000A6] font-normal text-[12px] leading-[100%] tracking-[0] border border-[#000000A6] font-inter px-1 mr-1"
                          key={id}
                        >
                          {genre?.name}{" "}
                        </span>
                      );
                    })}
                  </div>
                  <div className="movie-overview text-sm font-light">
                    {truncateText(movie.overview, 130)}
                  </div>
                  <Rate
                    className="custom-rate"
                    count={10}
                    onChange={(value) =>
                      handleRatingChange(movie, movie.id, value)
                    }
                    value={rating[movie.id] ?? 0}
                    style={{
                      fontSize: 18,
                      whiteSpace: "nowrap",
                      display: "flex",
                    }}
                    disabled={ratingLoading[movie.id]} // блокируем, пока идёт запрос
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
