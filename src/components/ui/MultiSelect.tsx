"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./MultiSelect.module.css";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function toggleValue(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
      return;
    }
    onChange([...selected, value]);
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>{selected.length > 0 ? `${selected.length} selected` : placeholder}</span>
        <span className={styles.chevron} aria-hidden="true">
          ▾
        </span>
      </button>

      {selected.length > 0 ? (
        <div className={styles.chips}>
          {selected.map((value) => {
            const option = options.find((item) => item.value === value);
            if (!option) return null;

            return (
              <span key={value} className={styles.chip}>
                <span>{option.label}</span>
                <button
                  type="button"
                  className={styles.chipRemove}
                  onClick={() => toggleValue(value)}
                  aria-label={`Remove ${option.label}`}
                >
                  x
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      {open ? (
        <div className={styles.menu}>
          {options.map((option) => (
            <label key={option.value} className={styles.optionRow}>
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => toggleValue(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
