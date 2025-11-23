import { ZypherAgent } from "@corespeed/zypher";
import { TransactionParser } from "../tools/transactionParser.ts";
import { TransactionCategorizer } from "../tools/categorizer.ts";
import { PatternDetector } from "../tools/patternDetector.ts";
import { FinancialCalculator } from "../tools/calculator.ts";
import { InsightGenerator } from "../tools/insightGenerator.ts";
import { FinancialPlanner } from "./planner.ts";
import { FinancialReport } from "../types/index.ts";
import { OpenAIModelProvider } from "@corespeed/zypher";

export class FinancialAgent {  // ← Make sure 'export' is here!
  private planner: FinancialPlanner;
  private categorizer: TransactionCategorizer;
  private insightGenerator: InsightGenerator;

  constructor(private agent: ZypherAgent, private modelProvider: OpenAIModelProvider) {
    this.planner = new FinancialPlanner();
    this.categorizer = new TransactionCategorizer(modelProvider);
    this.insightGenerator = new InsightGenerator();
  }

  /**
   * Main method: Analyze financial data from CSV file
   */
  async analyzeFinances(csvFilePath: string): Promise<FinancialReport> {
    console.log("\n🤖 Financial Agent Starting Analysis...");
    console.log("=".repeat(60));

    try {
      // Step 1: Parse transaction data
      console.log("\n📂 STEP 1: Loading transaction data...");
      const parsedData = await TransactionParser.parseCSV(csvFilePath);
      TransactionParser.displaySummary(parsedData);

      // Step 2: Create analysis plan (agentic decision-making)
      console.log("\n🧠 STEP 2: Creating analysis plan...");
      const plan = await this.planner.createPlan(parsedData);

      // Step 3: Execute plan (agentic tool orchestration)
      console.log("\n⚙️  STEP 3: Executing analysis plan...");
      let categorizedTransactions = parsedData.transactions.map((t) => ({
        ...t,
        category: "Other" as any,
        confidence: 0,
      }));
      let metrics: any = null;
      let patterns: any[] = [];
      let insights: any[] = [];

      for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];
        console.log(`\n  [${i + 1}/${plan.steps.length}] ${step.tool}: ${step.action}`);

        switch (step.tool) {
          case "categorizer":
            categorizedTransactions = await this.categorizer.categorizeTransactions(
              parsedData.transactions,
            );
            TransactionCategorizer.displaySummary(categorizedTransactions);
            break;

          case "calculator":
            metrics = FinancialCalculator.calculateMetrics(categorizedTransactions);
            FinancialCalculator.displaySummary(metrics);
            break;

          case "patternDetector":
            patterns = PatternDetector.detectPatterns(categorizedTransactions);
            PatternDetector.displaySummary(patterns);
            break;

          case "insightGenerator":
            insights = await this.insightGenerator.generateInsights(
              metrics,
              patterns,
              categorizedTransactions,
            );
            InsightGenerator.displaySummary(insights);
            break;

          default:
            console.log(`  ⚠️  Unknown tool: ${step.tool}`);
        }
      }

      // Step 4: Generate final report
      console.log("\n📊 STEP 4: Generating final report...");
      const report: FinancialReport = {
        summary: this.generateSummary(metrics, patterns, insights),
        metrics,
        patterns,
        insights,
        generatedAt: new Date(),
      };

      console.log("\n✅ Analysis Complete!");
      console.log("=".repeat(60));

      return report;
    } catch (error) {
      console.error("\n❌ Error during analysis:", error);
      throw error;
    }
  }

  /**
   * Generate executive summary
   */
  private generateSummary(metrics: any, patterns: any[], insights: any[]): string {
    const lines: string[] = [];

    lines.push("FINANCIAL ANALYSIS SUMMARY");
    lines.push("");
    lines.push(`Total Spending: $${metrics.totalSpending.toFixed(2)}`);
    lines.push(`Total Income: $${metrics.totalIncome.toFixed(2)}`);
    lines.push(`Net Cash Flow: $${metrics.netCashFlow.toFixed(2)}`);
    lines.push(`Average Monthly Spending: $${metrics.averageMonthly.toFixed(2)}`);
    lines.push("");

    // Top category
    if (metrics.categoryBreakdown.length > 0) {
      const top = metrics.categoryBreakdown[0];
      lines.push(
        `Top Spending Category: ${top.category} ($${top.total.toFixed(2)}, ${top.percentage.toFixed(1)}%)`,
      );
    }

    // Patterns found
    if (patterns.length > 0) {
      lines.push(`Patterns Detected: ${patterns.length}`);
    }

    // Key insights
    if (insights.length > 0) {
      const topInsight = insights[0];
      lines.push(`Key Insight: ${topInsight.title}`);
    }

    return lines.join("\n");
  }

  /**
   * Display final report
   */
  static displayReport(report: FinancialReport): void {
    console.log("\n" + "=".repeat(60));
    console.log("📋 FINAL FINANCIAL REPORT");
    console.log("=".repeat(60));
    console.log(report.summary);
    console.log("=".repeat(60));
    console.log(`Generated at: ${report.generatedAt.toLocaleString()}`);
    console.log("=".repeat(60));
  }

  /**
   * Save report to file
   */
  static async saveReport(report: FinancialReport, outputPath: string): Promise<void> {
    const reportText = JSON.stringify(report, null, 2);
    await Deno.writeTextFile(outputPath, reportText);
    console.log(`\n💾 Report saved to: ${outputPath}`);
  }
}