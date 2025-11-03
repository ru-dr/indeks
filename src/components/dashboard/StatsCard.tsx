import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-primary",
}: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="mt-2 text-3xl font-bold">{value}</h3>
          {change && (
            <p
              className={cn(
                "mt-2 text-sm font-medium",
                changeType === "positive" && "text-green-500",
                changeType === "negative" && "text-red-500",
                changeType === "neutral" && "text-muted-foreground",
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className={cn("rounded-lg bg-primary/10 p-3", iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
