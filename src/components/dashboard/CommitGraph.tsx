"use client";

import { cn } from "@/lib/utils";

interface ActivityDay {
  date: string;
  count: number;
  month: number;
}

export function CommitGraph() {
  const generateActivityData = (): ActivityDay[] => {
    const data: ActivityDay[] = [];
    const today = new Date();

    for (let i = 240; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const count = Math.floor(Math.random() * 50);
      data.push({
        date: date.toISOString().split("T")[0],
        count,
        month: date.getMonth(),
      });
    }

    return data;
  };

  const activityData = generateActivityData();

  const getActivityColor = (count: number) => {
    if (count === 0) return "bg-secondary";
    if (count < 10) return "bg-[var(--color-indeks-green)]/20";
    if (count < 20) return "bg-[var(--color-indeks-green)]/40";
    if (count < 30) return "bg-[var(--color-indeks-green)]/60";
    if (count < 40) return "bg-[var(--color-indeks-green)]/80";
    return "bg-[var(--color-indeks-green)]";
  };

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
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
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
                              : "bg-transparent",
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
    </div>
  );
}
