"use client";

import styles from "./FilterPills.module.css";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

interface FilterPillsProps<T extends string> {
  options: FilterOption<T>[];
  activeValue: T;
  onChange: (value: T) => void;
}

export function FilterPills<T extends string>({
  options,
  activeValue,
  onChange,
}: FilterPillsProps<T>) {
  return (
    <div className={styles.pills} role="tablist" aria-label="Filters">
      {options.map((option) => {
        const isActive = option.value === activeValue;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.pill} ${isActive ? styles.pillActive : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
