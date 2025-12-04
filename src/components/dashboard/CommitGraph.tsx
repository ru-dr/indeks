"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ActivityDay {
  date: string;
  count: number;
  month: number;
}

interface TrafficDataResponse {
  dailyData: Array<{ date: string; count: number }>;
}

interface CommitGraphProps {
  projectId?: string;
}

export function CommitGraph({ projectId }: CommitGraphProps) {
  const [activityData, setActivityData] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxCount, setMaxCount] = useState(0);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Wait until we know if it's mobile or not
    if (isMobile === null) return;

    const fetchTrafficData = async () => {
      setLoading(true);
      try {
        const months = isMobile ? 3 : 8;
        const days = isMobile ? 90 : 240;

        const url = projectId
          ? `/api/v1/analytics/${projectId}/traffic-trend?months=${months}`
          : `/api/v1/analytics/global/traffic-trend?months=${months}`;

        const response = await fetch(url);
        if (response.ok) {
          const data: TrafficDataResponse = await response.json();

          const dataMap = new Map<string, number>();
          (data.dailyData || []).forEach((d) => {
            dataMap.set(d.date, d.count);
          });

          const today = new Date();
          const activityDays: ActivityDay[] = [];
          let max = 0;

          for (let i = days; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];
            const count = dataMap.get(dateStr) || 0;
            if (count > max) max = count;

            activityDays.push({
              date: dateStr,
              count,
              month: date.getMonth(),
            });
          }

          setActivityData(activityDays);
          setMaxCount(max);
        } else {
          generateEmptyData();
        }
      } catch (error) {
        console.error("Error fetching traffic data:", error);
        generateEmptyData();
      } finally {
        setLoading(false);
      }
    };

    const generateEmptyData = () => {
      const data: ActivityDay[] = [];
      const today = new Date();
      const days = isMobile ? 90 : 240;

      for (let i = days; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toISOString().split("T")[0],
          count: 0,
          month: date.getMonth(),
        });
      }
      setActivityData(data);
      setMaxCount(0);
    };

    fetchTrafficData();
  }, [projectId, isMobile]);

  const getActivityColor = (count: number) => {
    if (count === 0) return "bg-secondary";
    if (maxCount === 0) return "bg-secondary";

    const percentage = count / maxCount;
    if (percentage < 0.2) return "bg-[var(--color-indeks-green)]/20";
    if (percentage < 0.4) return "bg-[var(--color-indeks-green)]/40";
    if (percentage < 0.6) return "bg-[var(--color-indeks-green)]/60";
    if (percentage < 0.8) return "bg-[var(--color-indeks-green)]/80";
    return "bg-[var(--color-indeks-green)]";
  };

  // Show loading while determining mobile state or fetching data
  if (loading || isMobile === null) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasData = maxCount > 0;

  // Mobile: Show simplified bar chart view
  if (isMobile) {
    // Aggregate by week for mobile view
    const weeklyData: { week: string; count: number }[] = [];
    const weeksToShow = 12;
    const today = new Date();

    for (let i = 0; i < weeksToShow; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (weeksToShow - 1 - i) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      let weekCount = 0;
      activityData.forEach((day) => {
        const dayDate = new Date(day.date);
        if (dayDate >= weekStart && dayDate <= weekEnd) {
          weekCount += day.count;
        }
      });

      weeklyData.push({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        count: weekCount,
      });
    }

    const maxWeekCount = Math.max(...weeklyData.map((w) => w.count), 1);

    return (
      <div className="space-y-2">
        {/* Mobile: Weekly bar chart */}
        <div className="flex items-end gap-1" style={{ height: "100px" }}>
          {weeklyData.map((week, index) => {
            const heightPx = week.count > 0 
              ? Math.max((week.count / maxWeekCount) * 92, 8) 
              : 4;
            return (
              <div
                key={index}
                className="flex-1 flex flex-col justify-end"
              >
                <div
                  className={cn(
                    "w-full rounded-t-sm",
                    week.count > 0
                      ? "bg-[var(--color-indeks-green)]"
                      : "bg-secondary"
                  )}
                  style={{ height: `${heightPx}px` }}
                  title={`Week of ${week.week}: ${week.count} events`}
                />
              </div>
            );
          })}
        </div>

        {/* Week labels - show every 3rd */}
        <div className="flex gap-1">
          {weeklyData.map((week, index) => (
            <div
              key={index}
              className="flex-1 text-center text-[9px] text-muted-foreground"
            >
              {index % 3 === 0 ? week.week : ""}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>Last 12 weeks</span>
          {!hasData && <span>No data yet</span>}
        </div>
      </div>
    );
  }

  // Desktop: Full commit graph
  // Process data into months
  const monthsData: {
    month: string;
    year: number;
    weeks: (ActivityDay | null)[][];
  }[] = [];

  const daysByMonth = new Map<string, ActivityDay[]>();

  activityData.forEach((day) => {
    const date = new Date(day.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

    if (!daysByMonth.has(monthKey)) {
      daysByMonth.set(monthKey, []);
    }
    daysByMonth.get(monthKey)!.push(day);
  });

  daysByMonth.forEach((monthDays, monthKey) => {
    const [year, month] = monthKey.split("-").map(Number);
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const weeks: (ActivityDay | null)[][] = [];
    let currentWeek: (ActivityDay | null)[] = [];

    const firstDayOfWeek = firstDay.getDay();

    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const currentDate = new Date(year, month, day);
      const dateStr = currentDate.toISOString().split("T")[0];

      const dayData = monthDays.find((d) => d.date === dateStr);

      if (dayData) {
        currentWeek.push(dayData);
      } else {
        currentWeek.push({
          date: dateStr,
          count: 0,
          month: month,
        });
      }

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    monthsData.push({
      month: monthNames[month],
      year: year,
      weeks: weeks,
    });
  });

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <div className="flex gap-2">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] text-[10px] text-muted-foreground justify-around py-[3px] mt-6">
            <div className="h-[12px] leading-[12px]">Sun</div>
            <div className="h-[12px] leading-[12px]">Mon</div>
            <div className="h-[12px] leading-[12px]">Tue</div>
            <div className="h-[12px] leading-[12px]">Wed</div>
            <div className="h-[12px] leading-[12px]">Thu</div>
            <div className="h-[12px] leading-[12px]">Fri</div>
            <div className="h-[12px] leading-[12px]">Sat</div>
          </div>

          {/* Months with gaps */}
          <div className="flex gap-3">
            {monthsData.map((monthData, monthIndex) => (
              <div key={monthIndex} className="flex flex-col gap-1">
                {/* Month label */}
                <div className="text-[10px] text-muted-foreground font-medium mb-1 h-5 text-center">
                  {monthData.month}
                </div>

                {/* Weeks grid for this month */}
                <div className="flex gap-[3px]">
                  {monthData.weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-[3px]">
                      {week.map((day, dayIndex) => (
                        <div
                          key={dayIndex}
                          className={cn(
                            "h-[12px] w-[12px] rounded transition-all cursor-pointer",
                            day
                              ? `${getActivityColor(day.count)} hover:ring-2 hover:ring-[var(--color-indeks-green)]/50`
                              : "bg-transparent"
                          )}
                          title={day ? `${day.date}: ${day.count} events` : ""}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="h-[12px] w-[12px] rounded bg-secondary" />
            <div className="h-[12px] w-[12px] rounded bg-[var(--color-indeks-green)]/20" />
            <div className="h-[12px] w-[12px] rounded bg-[var(--color-indeks-green)]/40" />
            <div className="h-[12px] w-[12px] rounded bg-[var(--color-indeks-green)]/60" />
            <div className="h-[12px] w-[12px] rounded bg-[var(--color-indeks-green)]/80" />
            <div className="h-[12px] w-[12px] rounded bg-[var(--color-indeks-green)]" />
          </div>
          <span>More</span>
        </div>
        {!hasData && (
          <span className="text-xs text-muted-foreground">
            No data yet — sync your projects to see activity
          </span>
        )}
      </div>
    </div>
  );
}
