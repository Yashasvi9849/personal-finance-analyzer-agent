import { AnalysisPlan, AnalysisStep, ParsedTransactions } from "../types/index.ts";

export class FinancialPlanner {
  async createPlan(data: ParsedTransactions): Promise<AnalysisPlan> {
    console.log("\n🧠 Agent is planning the analysis...");
    const plan = this.createSmartPlan(data);
    console.log(`✅ Plan created: ${plan.steps.length} steps`);
    this.displayPlan(plan);
    return plan;
  }

  private createSmartPlan(data: ParsedTransactions): AnalysisPlan {
    const steps: AnalysisStep[] = [];
    const daysDiff = (data.dateRange.end.getTime() - data.dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
    const monthsDiff = daysDiff / 30;

    steps.push({
      tool: "categorizer",
      action: "categorize all transactions",
      reason: "Categorization is the foundation for all other analyses",
    });

    steps.push({
      tool: "calculator",
      action: "calculate financial metrics",
      reason: "Get overall financial picture and spending breakdown",
    });

    if (data.totalCount > 20) {
      steps.push({
        tool: "patternDetector",
        action: "detect spending patterns and anomalies",
        reason: `With ${data.totalCount} transactions, pattern detection will find recurring charges and unusual spending`,
      });
    }

    steps.push({
      tool: "insightGenerator",
      action: "generate actionable recommendations",
      reason: "Provide specific advice based on spending patterns and metrics",
    });

    const rationale = this.generateRationale(data, monthsDiff);
    return {
      steps,
      rationale,
      estimatedDuration: this.estimateDuration(data.totalCount),
    };
  }

  private generateRationale(data: ParsedTransactions, monthsDiff: number): string {
    const reasons = [];
    if (data.totalCount < 50) {
      reasons.push("Small dataset - focused analysis on key metrics");
    } else if (data.totalCount < 200) {
      reasons.push("Medium dataset - standard comprehensive analysis");
    } else {
      reasons.push("Large dataset - thorough analysis with pattern detection");
    }
    if (monthsDiff >= 3) {
      reasons.push("Multi-month data enables trend analysis");
    }
    return reasons.join(". ");
  }

  private estimateDuration(transactionCount: number): number {
    return 30 + Math.ceil(transactionCount / 10);
  }

  private displayPlan(plan: AnalysisPlan): void {
    console.log("\n📋 Analysis Plan:");
    console.log("=".repeat(50));
    console.log(`Rationale: ${plan.rationale}`);
    console.log(`Estimated Duration: ${plan.estimatedDuration}s`);
    console.log("\nSteps:");
    plan.steps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step.tool}: ${step.action}`);
      console.log(`     → ${step.reason}`);
    });
    console.log("=".repeat(50));
  }
}
