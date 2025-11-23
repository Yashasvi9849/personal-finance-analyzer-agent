import {
  CategorizedTransaction,
  CategoryBreakdown,
  FinancialMetrics,
  SpendingCategory,
} from "../types/index.ts";

export class FinancialCalculator {
  /**
   * Calculate comprehensive financial metrics
   */
  static calculateMetrics(
    transactions: CategorizedTransaction[],
  ): FinancialMetrics {
    console.log("\n🧮 Calculating financial metrics...");

    const income = transactions.filter((t) => t.isIncome);
    const expenses = transactions.filter((t) => !t.isIncome);

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalSpending = expenses.reduce((sum, t) => sum + t.amount, 0);
    const netCashFlow = totalIncome - totalSpending;

    // Calculate time span
    const dates = transactions.map((t) => t.date.getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const daysDiff = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    const monthsDiff = daysDiff / 30;

    const averageDaily = totalSpending / (daysDiff || 1);
    const averageMonthly = totalSpending / (monthsDiff || 1);

    // Calculate category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(expenses);

    console.log("✅ Metrics calculated");

    return {
      totalSpending,
      totalIncome,
      netCashFlow,
      averageDaily,
      averageMonthly,
      categoryBreakdown,
    };
  }

  /**
   * Calculate spending breakdown by category
   */
  private static calculateCategoryBreakdown(
    expenses: CategorizedTransaction[],
  ): CategoryBreakdown[] {
    const categoryTotals = new Map<SpendingCategory, number>();
    const categoryCounts = new Map<SpendingCategory, number>();

    expenses.forEach((t) => {
      const currentTotal = categoryTotals.get(t.category) || 0;
      categoryTotals.set(t.category, currentTotal + t.amount);

      const currentCount = categoryCounts.get(t.category) || 0;
      categoryCounts.set(t.category, currentCount + 1);
    });

    const totalSpending = expenses.reduce((sum, t) => sum + t.amount, 0);

    const breakdown: CategoryBreakdown[] = [];

    categoryTotals.forEach((total, category) => {
      const count = categoryCounts.get(category) || 0;
      const percentage = (total / totalSpending) * 100;

      breakdown.push({
        category,
        total,
        percentage,
        transactionCount: count,
      });
    });

    // Sort by total spending (highest first)
    return breakdown.sort((a, b) => b.total - a.total);
  }

  /**
   * Calculate monthly spending trend
   */
  static calculateMonthlyTrend(
    transactions: CategorizedTransaction[],
  ): { month: string; amount: number }[] {
    const monthlyTotals = new Map<string, number>();

    transactions
      .filter((t) => !t.isIncome)
      .forEach((t) => {
        const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
        const current = monthlyTotals.get(monthKey) || 0;
        monthlyTotals.set(monthKey, current + t.amount);
      });

    return Array.from(monthlyTotals.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Calculate average transaction amount by category
   */
  static calculateAverageByCategory(
    transactions: CategorizedTransaction[],
  ): Map<SpendingCategory, number> {
    const categoryTotals = new Map<SpendingCategory, number>();
    const categoryCounts = new Map<SpendingCategory, number>();

    transactions
      .filter((t) => !t.isIncome)
      .forEach((t) => {
        const total = categoryTotals.get(t.category) || 0;
        categoryTotals.set(t.category, total + t.amount);

        const count = categoryCounts.get(t.category) || 0;
        categoryCounts.set(t.category, count + 1);
      });

    const averages = new Map<SpendingCategory, number>();

    categoryTotals.forEach((total, category) => {
      const count = categoryCounts.get(category) || 1;
      averages.set(category, total / count);
    });

    return averages;
  }

  /**
   * Display metrics summary
   */
  static displaySummary(metrics: FinancialMetrics): void {
    console.log("\n💰 Financial Metrics Summary:");
    console.log("=".repeat(50));
    console.log(`Total Income: $${metrics.totalIncome.toFixed(2)}`);
    console.log(`Total Spending: $${metrics.totalSpending.toFixed(2)}`);
    console.log(`Net Cash Flow: $${metrics.netCashFlow.toFixed(2)}`);
    console.log(`Average Daily: $${metrics.averageDaily.toFixed(2)}`);
    console.log(`Average Monthly: $${metrics.averageMonthly.toFixed(2)}`);

    console.log("\n📊 Breakdown by Category:");
    metrics.categoryBreakdown.forEach((cat) => {
      console.log(
        `  ${cat.category}: $${cat.total.toFixed(2)} (${cat.percentage.toFixed(1)}%) - ${cat.transactionCount} transactions`,
      );
    });

    console.log("=".repeat(50));
  }
}