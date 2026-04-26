"use client";

import { useMemo, useState } from "react";

import { ColumnHeader, type SortDirection } from "./ColumnHeader";
import styles from "./DataTable.module.css";

type Primitive = string | number | boolean | null | undefined;

export interface DataTableColumn<T> {
  key: string;
  label: string;
  getValue: (row: T) => Primitive;
  getFilterValues?: (row: T) => string[];
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  sortLabels?: {
    asc: string;
    desc: string;
  };
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T) => string;
  getRowOrder?: (row: T) => number;
}

function compareValues(a: Primitive, b: Primitive, direction: SortDirection) {
  const normalizedA = a ?? "";
  const normalizedB = b ?? "";

  if (typeof normalizedA === "number" && typeof normalizedB === "number") {
    return direction === "asc" ? normalizedA - normalizedB : normalizedB - normalizedA;
  }

  const textA = String(normalizedA).toLowerCase();
  const textB = String(normalizedB).toLowerCase();

  if (textA === textB) {
    return 0;
  }

  if (direction === "asc") {
    return textA > textB ? 1 : -1;
  }

  return textA > textB ? -1 : 1;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  getRowClassName,
  getRowOrder,
}: DataTableProps<T>) {
  const [openColumnKey, setOpenColumnKey] = useState<string | null>(null);
  const [sortState, setSortState] = useState<{
    key: string | null;
    direction: SortDirection;
  }>({
    key: null,
    direction: "asc",
  });
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  const computedData = useMemo(() => {
    const filtered = data.filter((row) =>
      columns.every((column) => {
        const selected = filters[column.key];
        if (!selected || selected.length === 0) {
          return true;
        }

        const values = column.getFilterValues
          ? column.getFilterValues(row)
          : [String(column.getValue(row) ?? "")];
        return values.some((value) => selected.includes(value));
      }),
    );

    const sorted = [...filtered];

    if (sortState.key) {
      const sortColumn = columns.find((column) => column.key === sortState.key);
      if (sortColumn) {
        sorted.sort((a, b) => {
          const rowOrderA = getRowOrder?.(a) ?? 0;
          const rowOrderB = getRowOrder?.(b) ?? 0;
          if (rowOrderA !== rowOrderB) {
            return rowOrderA - rowOrderB;
          }

          const valueA = sortColumn.getValue(a);
          const valueB = sortColumn.getValue(b);
          return compareValues(valueA, valueB, sortState.direction);
        });
      }
    } else if (getRowOrder) {
      sorted.sort((a, b) => getRowOrder(a) - getRowOrder(b));
    }

    return sorted;
  }, [columns, data, filters, getRowOrder, sortState.direction, sortState.key]);

  const filterOptionsByColumn = useMemo(() => {
    const map: Record<string, { value: string; label: string }[]> = {};

    columns.forEach((column) => {
      if (!column.filterable) {
        map[column.key] = [];
        return;
      }

      const values = new Set<string>();
      data.forEach((row) => {
        const rowValues = column.getFilterValues
          ? column.getFilterValues(row)
          : [String(column.getValue(row) ?? "")];
        rowValues.forEach((value) => values.add(value));
      });

      map[column.key] = [...values]
        .filter((value) => value.length > 0)
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value }));
    });

    return map;
  }, [columns, data]);

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>
            {columns.map((column) => {
              const activeFilters = filters[column.key] ?? [];
              return (
                <th key={column.key} className={styles.headerCell}>
                  {column.sortable || column.filterable ? (
                    <ColumnHeader
                      label={column.label}
                      isOpen={openColumnKey === column.key}
                      isSortedAsc={
                        sortState.key === column.key && sortState.direction === "asc"
                      }
                      isSortedDesc={
                        sortState.key === column.key && sortState.direction === "desc"
                      }
                      sortLabels={
                        column.sortLabels ?? {
                          asc: "Sort A \u2192 Z",
                          desc: "Sort Z \u2192 A",
                        }
                      }
                      filterOptions={filterOptionsByColumn[column.key] ?? []}
                      activeFilters={activeFilters}
                      onToggleOpen={() =>
                        setOpenColumnKey((current) =>
                          current === column.key ? null : column.key,
                        )
                      }
                      onSort={(direction) => {
                        setSortState({ key: column.key, direction });
                        setOpenColumnKey(null);
                      }}
                      onToggleFilter={(value) => {
                        setFilters((current) => {
                          const existing = current[column.key] ?? [];
                          const nextValues = existing.includes(value)
                            ? existing.filter((item) => item !== value)
                            : [...existing, value];

                          return {
                            ...current,
                            [column.key]: nextValues,
                          };
                        });
                      }}
                    />
                  ) : (
                    column.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {computedData.map((row) => {
            const clickable = Boolean(onRowClick);
            return (
              <tr
                key={rowKey(row)}
                className={`${styles.bodyRow} ${
                  clickable ? styles.bodyRowClickable : ""
                } ${getRowClassName?.(row) ?? ""}`}
                onClick={clickable ? () => onRowClick?.(row) : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} className={styles.bodyCell}>
                    {column.render ? column.render(row) : String(column.getValue(row) ?? "")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
