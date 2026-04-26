"use client";

import { useEffect, useRef } from "react";

import styles from "./ColumnHeader.module.css";

export type SortDirection = "asc" | "desc";

interface FilterOption {
  value: string;
  label: string;
}

interface ColumnHeaderProps {
  label: string;
  isOpen: boolean;
  isSortedAsc: boolean;
  isSortedDesc: boolean;
  sortLabels: {
    asc: string;
    desc: string;
  };
  filterOptions: FilterOption[];
  activeFilters: string[];
  onToggleOpen: () => void;
  onSort: (direction: SortDirection) => void;
  onToggleFilter: (value: string) => void;
}

export function ColumnHeader({
  label,
  isOpen,
  isSortedAsc,
  isSortedDesc,
  sortLabels,
  filterOptions,
  activeFilters,
  onToggleOpen,
  onSort,
  onToggleFilter,
}: ColumnHeaderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        onToggleOpen();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggleOpen]);

  return (
    <div className={styles.wrap} ref={containerRef}>
      <button type="button" className={styles.trigger} onClick={onToggleOpen}>
        <span>{label}</span>
        <span className={styles.arrow}>▾</span>
      </button>

      {isOpen ? (
        <div className={styles.menu}>
          <button
            type="button"
            className={`${styles.menuItem} ${isSortedAsc ? styles.menuItemActive : ""}`}
            onClick={() => onSort("asc")}
          >
            {sortLabels.asc}
          </button>
          <button
            type="button"
            className={`${styles.menuItem} ${isSortedDesc ? styles.menuItemActive : ""}`}
            onClick={() => onSort("desc")}
          >
            {sortLabels.desc}
          </button>

          {filterOptions.length > 0 ? <div className={styles.divider} /> : null}

          {filterOptions.map((option) => {
            const checked = activeFilters.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                className={styles.filterItem}
                onClick={() => onToggleFilter(option.value)}
              >
                <span
                  className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ""}`}
                  aria-hidden="true"
                />
                <span className={styles.filterLabel}>{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
