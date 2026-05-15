import { useState, useEffect } from "react";

const RESET_DAYS = 2;
const FREE_LIMIT = 10;

export function useDailyLimit() {
  const [dailyCount, setDailyCount] = useState(() => {
    const saved = localStorage.getItem("bb_daily_v2");
    if (!saved) return 0;
    try {
      const { resetDate, count } = JSON.parse(saved);
      const lastReset = new Date(resetDate);
      const now = new Date();
      const daysDiff = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));
      if (daysDiff >= RESET_DAYS) return 0;
      return count;
    } catch { return 0; }
  });

  useEffect(() => {
    const saved = localStorage.getItem("bb_daily_v2");
    let resetDate = new Date().toISOString();
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        const daysDiff = Math.floor(
          (new Date() - new Date(parsed.resetDate)) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff < RESET_DAYS) resetDate = parsed.resetDate;
      }
    } catch {}
    localStorage.setItem("bb_daily_v2", JSON.stringify({ 
      resetDate, 
      count: dailyCount 
    }));
  }, [dailyCount]);

  const incrementDailyCount = () => setDailyCount(prev => prev + 1);
  const dailyLeft = Math.max(0, FREE_LIMIT - dailyCount);

  return { dailyCount, setDailyCount, incrementDailyCount, dailyLeft };
}
