import {
  CategorizedTransaction,
  DetectedPattern,
  PatternType,
} from "../types/index.ts";

export class PatternDetector {
  /**
   * Detect all patterns in transactions
   */
  static detectPatterns(
  transactions: CategorizedTransaction[],
): DetectedPattern[] {
  console.log("\n🔍 Detecting spending patterns...");

  const patterns: DetectedPattern[] = [];

  // Detect different pattern types
  const recurringPatterns = this.findRecurringCharges(transactions);
  patterns.push(...recurringPatterns);
  
  // Pass recurring patterns to anomaly detector to exclude them
  patterns.push(...this.findAnomalies(transactions, recurringPatterns));
  
  patterns.push(...this.findSpendingSpikes(transactions));
  patterns.push(...this.findTrends(transactions));

  console.log(`✅ Found ${patterns.length} patterns`);

  return patterns.sort((a, b) => b.impact - a.impact);
}

  /**
   * Find recurring charges (subscriptions)
   */
  private static findRecurringCharges(
    transactions: CategorizedTransaction[],
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const descriptionGroups = new Map<string, CategorizedTransaction[]>();

    // Group similar transactions
    transactions.forEach((t) => {
      const normalized = this.normalizeDescription(t.description);
      const existing = descriptionGroups.get(normalized) || [];
      existing.push(t);
      descriptionGroups.set(normalized, existing);
    });

    // Find recurring patterns
    descriptionGroups.forEach((txns, desc) => {
      if (txns.length >= 2) {
        // Check if amounts are similar
        const amounts = txns.map((t) => t.amount);
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const variance = amounts.every((amt) =>
          Math.abs(amt - avgAmount) < avgAmount * 0.1
        );

        if (variance) {
          // Check if dates are evenly spaced
          const dates = txns.map((t) => t.date.getTime()).sort((a, b) => a - b);
          const intervals = [];
          for (let i = 1; i < dates.length; i++) {
            intervals.push(dates[i] - dates[i - 1]);
          }

          const avgInterval = intervals.reduce((a, b) => a + b, 0) /
            intervals.length;
          const daysInterval = avgInterval / (1000 * 60 * 60 * 24);

          // Monthly subscription (25-35 days)
          if (daysInterval >= 25 && daysInterval <= 35) {
            patterns.push({
              type: "recurring_charge",
              description:
                `Recurring monthly charge: ${desc} ($${avgAmount.toFixed(2)}/month)`,
              transactions: txns,
              severity: avgAmount > 50 ? "medium" : "low",
              impact: avgAmount * 12, // Annual cost
            });
          }
        }
      }
    });

    return patterns;
  }

  /**
   * Find spending spikes
   */
  /**
   * Find spending spikes
   */
  private static findSpendingSpikes(
    transactions: CategorizedTransaction[],
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    // Group by month and category
    const monthlyByCategory = new Map<string,
      Map<string, CategorizedTransaction[]>
    >();

    transactions.forEach((t) => {
      if (t.isIncome) return;

      const monthKey = `${t.date.getFullYear()}-${t.date.getMonth()}`;
      const categoryMap = monthlyByCategory.get(monthKey) || new Map();
      const txns = categoryMap.get(t.category) || [];
      txns.push(t);
      categoryMap.set(t.category, txns);
      monthlyByCategory.set(monthKey, categoryMap);
    });

    // Analyze each category across months
    const categoryMonthlyTotals = new Map<string, number[]>();

    monthlyByCategory.forEach((categoryMap) => {
      categoryMap.forEach((txns, category) => {
        const total = txns.reduce((sum, t) => sum + t.amount, 0);
        const totals = categoryMonthlyTotals.get(category) || [];
        totals.push(total);
        categoryMonthlyTotals.set(category, totals);
      });
    });

    // Find spikes (>50% above average)
    categoryMonthlyTotals.forEach((totals, category) => {
      if (totals.length < 2) return;

      const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
      const max = Math.max(...totals);

      if (max > avg * 1.5) {
        const spikeAmount = max - avg;
        patterns.push({
          type: "spending_spike",
          description:
            `Spending spike in ${category}: $${max.toFixed(2)} vs avg $${avg.toFixed(2)}`,
          transactions: [],
          severity: spikeAmount > 500 ? "high" : "medium",
          impact: spikeAmount,
        });
      }
    });

    return patterns;
  }

  /**
   * Find anomalies (unusual transactions)
   */
  private static findAnomalies(
  transactions: CategorizedTransaction[],
  recurringPatterns: DetectedPattern[],
): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  // Get descriptions of recurring transactions to exclude them
  const recurringDescriptions = new Set<string>();
  recurringPatterns.forEach(pattern => {
    pattern.transactions.forEach(t => {
      recurringDescriptions.add(this.normalizeDescription(t.description));
    });
  });

  // Calculate average transaction amount
  const amounts = transactions
    .filter((t) => !t.isIncome)
    .map((t) => t.amount);

  if (amounts.length === 0) return patterns;

  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const stdDev = Math.sqrt(
    amounts.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) /
      amounts.length,
  );

  // Find transactions >3 standard deviations from mean
  // BUT exclude recurring charges (like rent)
  transactions.forEach((t) => {
    if (t.isIncome) return;

    const normalized = this.normalizeDescription(t.description);
    
    // Skip if this is a known recurring charge
    if (recurringDescriptions.has(normalized)) {
      return;
    }

    if (t.amount > avg + 3 * stdDev) {
      patterns.push({
        type: "anomaly",
        description:
          `Unusual large transaction: ${t.description} ($${t.amount.toFixed(2)})`,
        transactions: [t],
        severity: t.amount > 1000 ? "high" : "medium",
        impact: t.amount,
      });
    }
  });

  return patterns;
}

  /**
   * Find trends (increasing/decreasing spending)
   */
  private static findTrends(
    transactions: CategorizedTransaction[],
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    // Group by month
    const monthlyTotals = new Map<string, number>();

    transactions.forEach((t) => {
      if (t.isIncome) return;

      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
      const current = monthlyTotals.get(monthKey) || 0;
      monthlyTotals.set(monthKey, current + t.amount);
    });

    // Need at least 2 months for trend
    if (monthlyTotals.size < 2) return patterns;

    const sortedMonths = Array.from(monthlyTotals.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    // Calculate trend
    const firstMonth = sortedMonths[0][1];
    const lastMonth = sortedMonths[sortedMonths.length - 1][1];
    const change = lastMonth - firstMonth;
    const percentChange = (change / firstMonth) * 100;

    if (Math.abs(percentChange) > 15) {
      const direction = change > 0 ? "increasing" : "decreasing";
      patterns.push({
        type: "trend",
        description:
          `Spending ${direction} by ${Math.abs(percentChange).toFixed(1)}% over time`,
        transactions: [],
        severity: Math.abs(percentChange) > 30 ? "high" : "medium",
        impact: Math.abs(change),
      });
    }

    return patterns;
  }

  /**
   * Normalize transaction description for matching
   */
  private static normalizeDescription(desc: string): string {
    return desc
      .toLowerCase()
      .replace(/\d+/g, "") // Remove numbers
      .replace(/[^a-z\s]/g, "") // Remove special chars
      .trim()
      .split(/\s+/)
      .slice(0, 3) // First 3 words
      .join(" ");
  }

  /**
   * Display pattern summary
   */
  static displaySummary(patterns: DetectedPattern[]): void {
    console.log("\n📊 Pattern Detection Summary:");
    console.log("=".repeat(50));

    const byType = new Map<PatternType, DetectedPattern[]>();

    patterns.forEach((p) => {
      const existing = byType.get(p.type) || [];
      existing.push(p);
      byType.set(p.type, existing);
    });

    byType.forEach((patterns, type) => {
      console.log(`\n${type.toUpperCase().replace("_", " ")}:`);
      patterns.forEach((p) => {
        const severityEmoji = {
          low: "🟢",
          medium: "🟡",
          high: "🔴",
        };
        console.log(
          `  ${severityEmoji[p.severity]} ${p.description}`,
        );
      });
    });

    console.log("\n" + "=".repeat(50));
  }
}