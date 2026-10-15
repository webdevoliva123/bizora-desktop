import type {
    ReportHealth,
    ReportHealthComponent,
    ReportHealthStatus,
    ReportInsight,
    ReportPeriodType,
    ReportTotals,
  } from "@/lib/types/report";
  
  const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
  
  const percent = (value: number, digits = 1) =>
    `${(value * 100).toFixed(digits)}%`;
  
  const signed = (value: number) =>
    `${value > 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
  
  export const totalCosts = (totals: ReportTotals) =>
    totals.purchases + totals.expenses + totals.salaries;
  
  /** (current - previous) / |previous|. null when there is no base to compare to. */
  export function pctChange(current: number, previous: number): number | null {
    if (previous === 0) return current === 0 ? 0 : null;
  
    return (current - previous) / Math.abs(previous);
  }
  
  /* -------------------------------------------------------------------------- */
  /* Health score                                                               */
  /* -------------------------------------------------------------------------- */
  
  const LABELS: Record<ReportHealthStatus, string> = {
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    weak: "Needs attention",
    critical: "Critical",
    no_data: "Not enough data",
  };
  
  const SUMMARIES: Record<ReportHealthStatus, string> = {
    excellent: "The business is doing very well: healthy profit, growing sales and dues under control.",
    good: "The business is in good shape. A few areas could still improve.",
    fair: "The business is holding steady, but margins or collections need watching.",
    weak: "Several indicators are under pressure. Review costs and collections soon.",
    critical: "The business is losing money or cash is badly stretched. Act on the points below.",
    no_data: "Record some sales, purchases or expenses to see how the business is doing.",
  };
  
  function statusFor(score: number | null): ReportHealthStatus {
    if (score === null) return "no_data";
    if (score >= 80) return "excellent";
    if (score >= 65) return "good";
    if (score >= 45) return "fair";
    if (score >= 25) return "weak";
  
    return "critical";
  }
  
  export function buildHealth(
    current: ReportTotals,
    previous: ReportTotals,
    receivable: number,
    previousLabel: string,
  ): ReportHealth {
    const components: ReportHealthComponent[] = [];
  
    const costs = totalCosts(current);
    const previousCosts = totalCosts(previous);
    const hasPrevious = previous.sales > 0 || previousCosts > 0;
  
    // 1. Profitability: -10% margin scores 0, +20% margin scores 100
    if (current.sales > 0) {
      const margin = current.profit / current.sales;
  
      components.push({
        key: "profitability",
        label: "Profitability",
        weight: 35,
        score: Math.round(clamp01((margin + 0.1) / 0.3) * 100),
        detail: `${percent(margin)} profit margin`,
      });
    } else if (costs > 0) {
      components.push({
        key: "profitability",
        label: "Profitability",
        weight: 35,
        score: 0,
        detail: "Costs recorded but no sales",
      });
    }
  
    // 2. Sales growth: -20% scores 0, +20% scores 100
    if (current.sales > 0 || previous.sales > 0) {
      const growth = pctChange(current.sales, previous.sales);
  
      components.push({
        key: "growth",
        label: "Sales growth",
        weight: 20,
        score:
          growth === null
            ? 75
            : Math.round(clamp01((growth + 0.2) / 0.4) * 100),
        detail:
          growth === null
            ? `First sales, nothing in ${previousLabel} to compare`
            : `Sales ${signed(growth)} vs ${previousLabel}`,
      });
    }
  
    // 3. Collection: share of sales actually collected as cash
    if (current.sales > 0) {
      const rate = current.collected / current.sales;
  
      components.push({
        key: "collection",
        label: "Cash collection",
        weight: 15,
        score: Math.round(clamp01(rate) * 100),
        detail: `${percent(rate, 0)} of sales collected as cash`,
      });
    }
  
    // 4. Cost control: are costs a smaller share of sales than before?
    if (current.sales > 0 && previous.sales > 0) {
      const ratio = costs / current.sales;
      const previousRatio = previousCosts / previous.sales;
  
      components.push({
        key: "costs",
        label: "Cost control",
        weight: 20,
        score: Math.round(clamp01((previousRatio - ratio + 0.1) / 0.2) * 100),
        detail: `Costs are ${percent(ratio, 0)} of sales (${percent(previousRatio, 0)} in ${previousLabel})`,
      });
    }
  
    // 5. Dues: how much of the period's sales customers still owe
    if (current.sales > 0) {
      const ratio = receivable / current.sales;
  
      components.push({
        key: "dues",
        label: "Customer dues",
        weight: 10,
        score: Math.round(clamp01((1 - ratio) / 0.9) * 100),
        detail: `Customers owe ${percent(ratio, 0)} of this period's sales`,
      });
    }
  
    const totalWeight = components.reduce((sum, item) => sum + item.weight, 0);
    const score =
      totalWeight > 0
        ? Math.round(
            components.reduce((sum, item) => sum + item.score * item.weight, 0) /
              totalWeight,
          )
        : null;
  
    let trend: ReportHealth["trend"] = "steady";
  
    if (!hasPrevious) {
      trend = "new";
    } else {
      const change = pctChange(current.profit, previous.profit);
  
      if (change === null) {
        trend = current.profit > previous.profit ? "improving" : "declining";
      } else if (change > 0.05) {
        trend = "improving";
      } else if (change < -0.05) {
        trend = "declining";
      }
    }
  
    const status = statusFor(score);
  
    return {
      score,
      status,
      label: LABELS[status],
      summary: SUMMARIES[status],
      trend,
      components,
    };
  }
  
  /* -------------------------------------------------------------------------- */
  /* Plain-language insights                                                    */
  /* -------------------------------------------------------------------------- */
  
  export function buildInsights(input: {
    type: ReportPeriodType;
    current: ReportTotals;
    previous: ReportTotals;
    previousLabel: string;
    receivable: number;
    payable: number;
    salaryDue: { total: number; workers: number };
    topExpense: { name: string; amount: number } | null;
    peak: { label: string; sales: number } | null;
    money: (amount: number) => string;
  }): ReportInsight[] {
    const { current, previous, money } = input;
    const insights: ReportInsight[] = [];
  
    const salesChange = pctChange(current.sales, previous.sales);
    const costs = totalCosts(current);
    const previousCosts = totalCosts(previous);
  
    if (previous.sales > 0 && salesChange !== null) {
      if (salesChange >= 0.05) {
        insights.push({
          tone: "positive",
          text: `Sales are up ${percent(salesChange)} compared with ${input.previousLabel}.`,
        });
      } else if (salesChange <= -0.05) {
        insights.push({
          tone: "negative",
          text: `Sales are down ${percent(Math.abs(salesChange))} compared with ${input.previousLabel}.`,
        });
      } else {
        insights.push({
          tone: "neutral",
          text: `Sales are steady compared with ${input.previousLabel}.`,
        });
      }
    }
  
    if (current.sales > 0 || costs > 0) {
      if (current.profit < 0) {
        insights.push({
          tone: "negative",
          text: `You are running at a loss of ${money(Math.abs(current.profit))} this period.`,
        });
      } else if (current.sales > 0 && (current.margin ?? 0) < 0.05) {
        insights.push({
          tone: "negative",
          text: `Profit is only ${percent(current.margin ?? 0)} of sales (${money(current.profit)}), a very thin margin.`,
        });
      } else if (current.sales > 0) {
        insights.push({
          tone: "positive",
          text: `You kept ${percent(current.margin ?? 0)} of sales as profit (${money(current.profit)}).`,
        });
      }
    }
  
    const costChange = pctChange(costs, previousCosts);
  
    if (
      costChange !== null &&
      costChange > 0.2 &&
      (salesChange === null || salesChange < costChange)
    ) {
      insights.push({
        tone: "negative",
        text: `Total spending rose ${percent(costChange)}, faster than sales.`,
      });
    }
  
    if (current.sales > 0 && current.purchases / current.sales > 0.8) {
      insights.push({
        tone: "negative",
        text: `Stock purchases are ${percent(current.purchases / current.sales, 0)} of sales, leaving little room for expenses and salaries.`,
      });
    }
  
    if (input.topExpense && current.expenses > 0) {
      const share = input.topExpense.amount / current.expenses;
  
      if (share >= 0.4) {
        insights.push({
          tone: "neutral",
          text: `${input.topExpense.name} is ${percent(share, 0)} of your expenses (${money(input.topExpense.amount)}).`,
        });
      }
    }
  
    if (input.receivable > 0 && current.sales > 0 && input.receivable > current.sales * 0.5) {
      insights.push({
        tone: "negative",
        text: `Customers owe you ${money(input.receivable)}. Collecting it would ease cash flow.`,
      });
    }
  
    if (input.payable > 0 && input.payable > current.purchases * 0.5) {
      insights.push({
        tone: "neutral",
        text: `You owe suppliers ${money(input.payable)}.`,
      });
    }
  
    if (input.salaryDue.total > 0) {
      insights.push({
        tone: "negative",
        text: `Salaries of ${money(input.salaryDue.total)} are still due for ${input.salaryDue.workers} ${input.salaryDue.workers === 1 ? "worker" : "workers"}.`,
      });
    }
  
    if (current.netCash < 0) {
      insights.push({
        tone: "negative",
        text: `More cash went out than came in (${money(Math.abs(current.netCash))} short).`,
      });
    }
  
    if (input.peak && input.peak.sales > 0) {
      insights.push({
        tone: "positive",
        text: `Best ${input.type === "month" ? "day" : "month"}: ${input.peak.label} with ${money(input.peak.sales)} in sales.`,
      });
    }
  
    return insights.slice(0, 8);
  }