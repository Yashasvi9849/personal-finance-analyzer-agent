// Transaction data structure
export interface Transaction {
  date: Date;
  description: string;
  amount: number;
  category?: string;
  isIncome: boolean;
}

// Parsed CSV data
export interface ParsedTransactions {
  transactions: Transaction[];
  totalCount: number;
  dateRange: {
    start: Date;
    end: Date;
  };
}

// Spending categories
export type SpendingCategory =
  | "Food & Dining"
  | "Transportation"
  | "Shopping"
  | "Entertainment"
  | "Bills & Utilities"
  | "Healthcare"
  | "Housing"
  | "Income"
  | "Other";

// Categorization result
export interface CategorizedTransaction extends Transaction {
  category: SpendingCategory;
  confidence: number;
}

// Detected pattern types
export type PatternType =
  | "recurring_charge"
  | "spending_spike"
  | "anomaly"
  | "trend";

// Pattern detection result
export interface DetectedPattern {
  type: PatternType;
  description: string;
  transactions: Transaction[];
  severity: "low" | "medium" | "high";
  impact: number; // Dollar amount
}

// Financial calculation results
export interface FinancialMetrics {
  totalSpending: number;
  totalIncome: number;
  netCashFlow: number;
  averageDaily: number;
  averageMonthly: number;
  categoryBreakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category: SpendingCategory;
  total: number;
  percentage: number;
  transactionCount: number;
}

// Insight/Recommendation
export interface Insight {
  title: string;
  description: string;
  category: "opportunity" | "alert" | "info";
  priority: number; // 1-10
  potentialSavings?: number;
  actionable: boolean;
}

// Analysis plan from agent planner
export interface AnalysisPlan {
  steps: AnalysisStep[];
  rationale: string;
  estimatedDuration: number; // seconds
}

export interface AnalysisStep {
  tool: string;
  action: string;
  reason: string;
}

// Final report
export interface FinancialReport {
  summary: string;
  metrics: FinancialMetrics;
  patterns: DetectedPattern[];
  insights: Insight[];
  generatedAt: Date;
}