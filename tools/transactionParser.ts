import { ParsedTransactions, Transaction } from "../types/index.ts";

export class TransactionParser {
  /**
   * Parse CSV file and return structured transaction data
   */
  static async parseCSV(filePath: string): Promise<ParsedTransactions> {
    const content = await Deno.readTextFile(filePath);
    const lines = content.split("\n").filter((line) => line.trim());

    if (lines.length === 0) {
      throw new Error("CSV file is empty");
    }

    // Parse header
    const headers = this.parseCSVLine(lines[0]);
    const transactions: Transaction[] = [];

    // Parse each transaction line
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      try {
        const transaction = this.parseTransaction(headers, values);
        transactions.push(transaction);
      } catch (error) {
        console.warn(`Skipping invalid transaction on line ${i + 1}:`, error.message);
      }
    }

    if (transactions.length === 0) {
      throw new Error("No valid transactions found in CSV");
    }

    // Calculate date range
    const dates = transactions.map((t) => t.date.getTime());
    const start = new Date(Math.min(...dates));
    const end = new Date(Math.max(...dates));

    return {
      transactions,
      totalCount: transactions.length,
      dateRange: { start, end },
    };
  }

  /**
   * Parse a single CSV line, handling quoted values
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Convert CSV row to Transaction object
   */
  private static parseTransaction(
    headers: string[],
    values: string[],
  ): Transaction {
    // Create header-value map
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header.toLowerCase()] = values[i] || "";
    });

    // Extract date
    const dateStr = row.date || row.transaction_date || row.posted_date;
    if (!dateStr) {
      throw new Error("No date field found");
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateStr}`);
    }

    // Extract description
    const description =
      row.description || row.merchant || row.name || "Unknown";

    // Extract amount
    const amountStr = row.amount || row.debit || row.credit || "0";
    const amount = Math.abs(parseFloat(amountStr.replace(/[$,]/g, "")));
    if (isNaN(amount)) {
      throw new Error(`Invalid amount: ${amountStr}`);
    }

    // Determine if income
    const isIncome = this.detectIncome(row, amount);

    return {
      date,
      description,
      amount,
      isIncome,
    };
  }

  /**
   * Detect if transaction is income
   */
  private static detectIncome(row: Record<string, string>, amount: number): boolean {
    // Check type field
    const type = (row.type || "").toLowerCase();
    if (type.includes("credit") || type.includes("deposit") || type.includes("income")) {
      return true;
    }

    // Check if amount is in credit column
    if (row.credit && parseFloat(row.credit.replace(/[$,]/g, "")) > 0) {
      return true;
    }

    // Check description for income keywords
    const desc = (row.description || "").toLowerCase();
    const incomeKeywords = [
      "payroll",
      "salary",
      "deposit",
      "payment received",
      "transfer from",
      "refund",
    ];

    return incomeKeywords.some((keyword) => desc.includes(keyword));
  }

  /**
   * Display summary of parsed data
   */
  static displaySummary(data: ParsedTransactions): void {
    console.log("\n📊 Transaction Data Summary:");
    console.log("=".repeat(50));
    console.log(`Total Transactions: ${data.totalCount}`);
    console.log(
      `Date Range: ${data.dateRange.start.toLocaleDateString()} - ${data.dateRange.end.toLocaleDateString()}`,
    );

    const income = data.transactions.filter((t) => t.isIncome);
    const expenses = data.transactions.filter((t) => !t.isIncome);

    console.log(`Income Transactions: ${income.length}`);
    console.log(`Expense Transactions: ${expenses.length}`);

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

    console.log(`Total Income: $${totalIncome.toFixed(2)}`);
    console.log(`Total Expenses: $${totalExpenses.toFixed(2)}`);
    console.log(`Net: $${(totalIncome - totalExpenses).toFixed(2)}`);
    console.log("=".repeat(50));
  }
}