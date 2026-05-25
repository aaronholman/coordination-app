"use client";

import Link from "next/link";
import { useMemo } from "react";

import type {
  Feature,
  FeatureComplexity,
  FeatureStatus,
  Profile,
  TaskPriority,
} from "@/lib/types/database";
import { formatEnumLabel } from "@/lib/utils/formatting";

import styles from "./KanbanBoard.module.css";

interface KanbanBoardProps {
  features: Feature[];
  profiles: Map<string, Profile>;
}

const columns: { status: FeatureStatus; label: string }[] = [
  { status: "idea", label: "Idea" },
  { status: "speccing", label: "Speccing" },
  { status: "building", label: "Building" },
  { status: "deployed", label: "Deployed" },
];

function columnClass(status: FeatureStatus) {
  if (status === "idea") return styles.columnIdea;
  if (status === "speccing") return styles.columnSpeccing;
  if (status === "building") return styles.columnBuilding;
  return styles.columnDeployed;
}

function priorityDotClass(priority: TaskPriority) {
  if (priority === "urgent") return styles.dotUrgent;
  if (priority === "high") return styles.dotHigh;
  if (priority === "medium") return styles.dotMedium;
  return styles.dotLow;
}

function complexityLabel(complexity: FeatureComplexity) {
  if (complexity === "small") return "S";
  if (complexity === "medium") return "M";
  return "L";
}

export function KanbanBoard({ features, profiles }: KanbanBoardProps) {
  const grouped = useMemo(() => {
    const map = new Map<FeatureStatus, Feature[]>();
    for (const col of columns) {
      map.set(col.status, []);
    }
    for (const feature of features) {
      const list = map.get(feature.status);
      if (list) {
        list.push(feature);
      }
    }
    return map;
  }, [features]);

  return (
    <div className={styles.board}>
      {columns.map((col) => {
        const items = grouped.get(col.status) ?? [];
        return (
          <div key={col.status} className={styles.column}>
            <div className={`${styles.columnHeader} ${columnClass(col.status)}`}>
              <span className={styles.columnLabel}>{col.label}</span>
              <span className={styles.columnCount}>{items.length}</span>
            </div>

            <div className={styles.columnBody}>
              {items.length > 0 ? (
                items.map((feature) => (
                  <Link
                    key={feature.id}
                    href={`/pipeline/${feature.id}`}
                    className={styles.card}
                  >
                    <div className={styles.cardTop}>
                      <span
                        className={`${styles.priorityDot} ${priorityDotClass(feature.priority)}`}
                      />
                      <span className={styles.cardTitle}>{feature.title}</span>
                    </div>
                    <div className={styles.cardMeta}>
                      {feature.target_module ? (
                        <span className={styles.cardTag}>
                          {formatEnumLabel(feature.target_module)}
                        </span>
                      ) : null}
                      <span className={styles.cardComplexity}>
                        {complexityLabel(feature.complexity)}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className={styles.emptyColumn}>No features</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
