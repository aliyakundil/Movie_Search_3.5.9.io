"use client";
import { Pagination, Input, Select } from "antd";
import { useState } from "react";
import { format } from "date-fns";

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
};

const { Search } = Input;
const { Option } = Select;

function MovieCards({ movies }: Props) {
  /* Пагинация */
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // считаем какие фильмы показывать
  const startIndex = (currentPage - 1) * pageSize;
  const currentMovies = movies.slice(startIndex, startIndex + pageSize);

  return (
    <div className="flex flex-col items-center gap-6 mt-8">
      <div className="flex justify-center gap-8 mt-6">
        <div className="flex flex-col items-center cursor-pointer">
          <span className="text-blue-500 font-medium">Search</span>
          <div className="w-10 h-[2px] bg-blue-500 mt-1"></div>
        </div>
        <div className="flex flex-col items-center cursor-pointer">
          <span className="text-gray-400 font-medium">Rated</span>
          <div className="w-10 h-[1px] bg-gray-200 mt-1"></div>
        </div>
      </div>

      {/* Поиск */}
      <Input.Search placeholder="Type to search" size="large" />

      {/* Сетка карточек */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
        {currentMovies.map((movie) => (
          <div
            key={movie.id}
            className="movie-card shadow flex gap-6 rounded-xl w-[451px]"
          >
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
                <div className="flex justify-center items-center text-xs font-normal border-2 w-[30px] h-[30px] border-amber-300 p-1 rounded-full">
                  {movie.vote_average}
                </div>
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
        ))}
      </div>

      <div className="mt-8 mb-8">
        <Pagination
          current={currentPage}
          total={movies.length}
          pageSize={pageSize}
          onChange={setCurrentPage}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
}

export default MovieCards;
