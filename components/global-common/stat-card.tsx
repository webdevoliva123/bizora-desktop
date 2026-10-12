
import type { ComponentType, ReactNode } from "react";
import { Card, CardContent } from "../ui/card";

type StatCardProps = {
  title: string;
  value: ReactNode;
  note?: string;
  icon: ComponentType<{ className?: string }>;
};

export default function StatCard({
  title,
  value,
  note,
  icon: Icon,
}: StatCardProps) {
  return (
    <Card>
      <CardContent >
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {title}
          </p>

          <Icon className="size-4 text-muted-foreground" />
        </div>

        <p className="mt-3 text-2xl font-semibold tabular-nums">
          {value}
        </p>

        {note && (
          <p className="mt-1 text-xs text-muted-foreground">
            {note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
