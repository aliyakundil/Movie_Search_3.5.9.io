"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type FilterContextType = {
  activeFilter: "search" | "rated";
  setActiveFilter: (filter: "search" | "rated") => void;
};

// Создаем контекст с undefined по умолчанию
const FilterContext = createContext<FilterContextType | undefined>(undefined);

// Провайдер контекста
export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [activeFilter, setActiveFilter] = useState<"search" | "rated">(
    "search"
  );

  return (
    <FilterContext.Provider value={{ activeFilter, setActiveFilter }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilter must be used within a FilterProvider");
  }
  return context;
};
