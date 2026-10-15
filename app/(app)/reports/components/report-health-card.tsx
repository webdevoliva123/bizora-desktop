import {
    AlertTriangle,
    CheckCircle2,
    Info,
    Minus,
    TrendingDown,
    TrendingUp,
  } from "lucide-react";
  
  import { Badge } from "@/components/ui/badge";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Progress } from "@/components/ui/progress";
  import { cn } from "@/lib/utils";
  import type { ReportData, ReportHealth } from "@/lib/types/report";
  
  import { HEALTH_STYLES } from "./report-format";
  
  export function ScoreRing({
    score,
    color,
    size = 128,
  }: {
    score: number | null;
    color: string;
    size?: number;
  }) {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const dash = circumference * ((score ?? 0) / 100);
  
    return (
      <svg width={size} height={size} viewBox="0 0 128 128" role="img" aria-label={`Health score ${score ?? "unavailable"}`}>
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 64 64)"
        />
        <text x="64" y="70" textAnchor="middle" fontSize="30" fontWeight="700" fill="currentColor">
          {score ?? "—"}
        </text>
        <text x="64" y="90" textAnchor="middle" fontSize="11" fill="#94a3b8">
          out of 100
        </text>
      </svg>
    );
  }
  
  export const TREND: Record<
    ReportHealth["trend"],
    { label: (previous: string) => string; icon: React.ComponentType<{ className?: string }>; className: string }
  > = {
    improving: { label: (p) => `Improving vs ${p}`, icon: TrendingUp, className: "text-emerald-600" },
    steady: { label: (p) => `Steady vs ${p}`, icon: Minus, className: "text-muted-foreground" },
    declining: { label: (p) => `Declining vs ${p}`, icon: TrendingDown, className: "text-red-600" },
    new: { label: () => "First period on record", icon: Info, className: "text-muted-foreground" },
  };
  
  const INSIGHT_ICON = {
    positive: { icon: CheckCircle2, className: "text-emerald-600" },
    negative: { icon: AlertTriangle, className: "text-red-600" },
    neutral: { icon: Info, className: "text-muted-foreground" },
  } as const;
  
  export function ReportHealthCard({ report }: { report: ReportData }) {
    const { health, insights, period } = report;
    const style = HEALTH_STYLES[health.status];
    const trend = TREND[health.trend];
    const TrendIcon = trend.icon;
  
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>How the business is going</CardTitle>
          <CardDescription>
            A score out of 100 for {period.label}, compared with {period.previousLabel}.
          </CardDescription>
        </CardHeader>
  
        <CardContent className="grid gap-8 pt-6 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col items-center gap-3 text-center lg:w-48">
            <ScoreRing score={health.score} color={style.color} />
  
            <Badge variant="outline" className={style.badge}>
              {health.label}
            </Badge>
  
            <p className={cn("inline-flex items-center gap-1.5 text-xs font-medium", trend.className)}>
              <TrendIcon className="size-3.5" />
              {trend.label(period.previousLabel)}
            </p>
          </div>
  
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{health.summary}</p>
  
            {health.components.length > 0 && (
              <div className="space-y-3">
                {health.components.map((item) => (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className="tabular-nums text-muted-foreground">{item.score}/100</span>
                    </div>
                    <Progress value={item.score} />
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
  
          <div className="space-y-3">
            <p className="text-sm font-medium">What stands out</p>
  
            {insights.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing to highlight yet for this period.
              </p>
            ) : (
              <ul className="space-y-3">
                {insights.map((insight, index) => {
                  const { icon: Icon, className } = INSIGHT_ICON[insight.tone];
  
                  return (
                    <li key={index} className="flex items-start gap-2.5 text-sm">
                      <Icon className={cn("mt-0.5 size-4 shrink-0", className)} />
                      <span>{insight.text}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }