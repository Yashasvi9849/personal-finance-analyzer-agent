import {
  CategorizedTransaction,
  SpendingCategory,
  Transaction,
} from "../types/index.ts";
import { OpenAIModelProvider } from "@corespeed/zypher";

export class TransactionCategorizer {
  constructor(private modelProvider: OpenAIModelProvider) {}

  /**
   * Categorize all transactions using AI
   */
  async categorizeTransactions(
    transactions: Transaction[],
  ): Promise<CategorizedTransaction[]> {
    console.log(`\n🏷️  Categorizing ${transactions.length} transactions...`);

    const categorized: CategorizedTransaction[] = [];

    // Use rule-based categorization for all transactions
    for (const transaction of transactions) {
      const result = this.ruleBasedCategorization(transaction);
      categorized.push(result);
    }

    console.log(`✅ Categorization complete!`);
    return categorized;
  }

  /**
   * Rule-based categorization (fallback)
   */
  private ruleBasedCategorization(
    transaction: Transaction,
  ): CategorizedTransaction {
    const desc = transaction.description.toLowerCase();

    // Food & Dining
    if (
      desc.includes("restaurant") ||
      desc.includes("cafe") ||
      desc.includes("starbucks") ||
      desc.includes("mcdonald") ||
      desc.includes("pizza") ||
      desc.includes("chipotle") ||
      desc.includes("subway") ||
      desc.includes("grocery") ||
      desc.includes("whole foods") ||
      desc.includes("trader joe")
    ) {
      return { ...transaction, category: "Food & Dining", confidence: 0.8 };
    }

    // Transportation
    if (
      desc.includes("uber") ||
      desc.includes("lyft") ||
      desc.includes("gas") ||
      desc.includes("fuel") ||
      desc.includes("shell") ||
      desc.includes("chevron") ||
      desc.includes("parking") ||
      desc.includes("transit")
    ) {
      return { ...transaction, category: "Transportation", confidence: 0.8 };
    }

    // Entertainment
    if (
      desc.includes("netflix") ||
      desc.includes("spotify") ||
      desc.includes("hulu") ||
      desc.includes("movie") ||
      desc.includes("theater") ||
      desc.includes("game") ||
      desc.includes("gym")
    ) {
      return { ...transaction, category: "Entertainment", confidence: 0.8 };
    }

    // Bills & Utilities
    if (
      desc.includes("electric") ||
      desc.includes("water") ||
      desc.includes("internet") ||
      desc.includes("phone") ||
      desc.includes("utility") ||
      desc.includes("bill")
    ) {
      return {
        ...transaction,
        category: "Bills & Utilities",
        confidence: 0.8,
      };
    }

    // Healthcare
    if (
      desc.includes("pharmacy") ||
      desc.includes("doctor") ||
      desc.includes("medical") ||
      desc.includes("hospital") ||
      desc.includes("cvs") ||
      desc.includes("walgreens")
    ) {
      return { ...transaction, category: "Healthcare", confidence: 0.8 };
    }

    // Housing
    if (
      desc.includes("rent") ||
      desc.includes("mortgage") ||
      desc.includes("landlord")
    ) {
      return { ...transaction, category: "Housing", confidence: 0.8 };
    }

    // Shopping
    if (
      desc.includes("amazon") ||
      desc.includes("target") ||
      desc.includes("walmart") ||
      desc.includes("best buy") ||
      desc.includes("store")
    ) {
      return { ...transaction, category: "Shopping", confidence: 0.7 };
    }

    // Income
    if (transaction.isIncome) {
      return { ...transaction, category: "Income", confidence: 0.9 };
    }

    // Default to Other
    return { ...transaction, category: "Other", confidence: 0.5 };
  }

  /**
   * Display categorization summary
   */
  static displaySummary(transactions: CategorizedTransaction[]): void {
    console.log("\n📊 Categorization Summary:");
    console.log("=".repeat(50));

    const categoryTotals = new Map<SpendingCategory, number>();
    const categoryCounts = new Map<SpendingCategory, number>();

    transactions.forEach((t) => {
      const current = categoryTotals.get(t.category) || 0;
      categoryTotals.set(t.category, current + t.amount);

      const count = categoryCounts.get(t.category) || 0;
      categoryCounts.set(t.category, count + 1);
    });

    const totalAmount = transactions
      .filter((t) => !t.isIncome)
      .reduce((sum, t) => sum + t.amount, 0);

    Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, amount]) => {
        const count = categoryCounts.get(category) || 0;
        const percentage = ((amount / totalAmount) * 100).toFixed(1);
        console.log(
          `${category}: $${amount.toFixed(2)} (${count} txns, ${percentage}%)`,
        );
      });

    console.log("=".repeat(50));
  }
}