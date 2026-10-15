import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { formatChange } from "./report-format";

export function KpiCard({
  title,
  value,
  icon: Icon,
  change,
  goodWhenUp = true,
  previousLabel,
  note,
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  change?: number | null;
  goodWhenUp?: boolean;
  previousLabel?: string;
  note?: string;
}) {
  const good =
    change == null || change === 0 ? null : change > 0 === goodWhenUp;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <Icon className="size-4 text-muted-foreground" />
        </div>

        <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>

        {change !== undefined && (
          <p className="mt-1 text-xs">
            <span
              className={cn(
                "font-medium",
                good === null
                  ? "text-muted-foreground"
                  : good
                    ? "text-emerald-600"
                    : "text-red-600",
              )}
            >
              {formatChange(change)}
            </span>{" "}
            <span className="text-muted-foreground">vs {previousLabel}</span>
          </p>
        )}

        {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}