"use client";

import { useEffect, useState } from "react";

import styles from "./page.module.css";

const MOBILE_CALENDAR_URL =
  "https://calendar.google.com/calendar/embed?src=family06377020747013711095%40group.calendar.google.com&ctz=America%2FNew_York&mode=AGENDA";
const DESKTOP_CALENDAR_URL =
  "https://calendar.google.com/calendar/embed?src=family06377020747013711095%40group.calendar.google.com&ctz=America%2FNew_York";

export function ResponsiveCalendarEmbed() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const updateIsMobile = (event?: MediaQueryListEvent) => {
      setIsMobile(event ? event.matches : mediaQuery.matches);
    };

    updateIsMobile();
    mediaQuery.addEventListener("change", updateIsMobile);
    window.addEventListener("orientationchange", updateIsMobile);

    return () => {
      mediaQuery.removeEventListener("change", updateIsMobile);
      window.removeEventListener("orientationchange", updateIsMobile);
    };
  }, []);

  return (
    <iframe
      src={isMobile ? MOBILE_CALENDAR_URL : DESKTOP_CALENDAR_URL}
      frameBorder="0"
      scrolling="no"
      className={styles.calendarIframe}
      title="Family Calendar"
    />
  );
}
