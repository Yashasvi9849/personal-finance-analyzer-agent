import {
  CategorizedTransaction,
  DetectedPattern,
  FinancialMetrics,
  Insight,
} from "../types/index.ts";
import { ZypherAgent } from "@corespeed/zypher";

export class InsightGenerator {
  constructor(private agent: ZypherAgent) {}

  /**
   * Generate AI-powered insights from financial data
   */
  async generateInsights(
    metrics: FinancialMetrics,
    patterns: DetectedPattern[],
    transactions: CategorizedTransaction[],
  ): Promise<Insight[]> {
    console.log("\n💡 Generating AI insights...");

    const prompt = this.buildInsightPrompt(metrics, patterns, transactions);

    try {
      // Use the agent to generate insights
      const response = await this.agent.chat(prompt, "gpt-4-turbo");
      
      // Parse the response
      const insights = this.parseInsightsFromText(response);
      console.log(`✅ Generated ${insights.length} insights`);
      return insights;
    } catch (error) {
      console.error("Failed to generate AI insights:", error);
      return this.generateFallbackInsights(metrics, patterns);
    }
  }

  /**
   * Build prompt for AI insight generation
   */
  private buildInsightPrompt(
    metrics: FinancialMetrics,
    patterns: DetectedPattern[],
    transactions: CategorizedTransaction[],
  ): string {
    const categoryBreakdown = metrics.categoryBreakdown
      .map((c) => `  - ${c.category}: $${c.total.toFixed(2)} (${c.percentage.toFixed(1)}%)`)
      .join("\n");

    const patternSummary = patterns
      .slice(0, 5)
      .map((p) => `  - ${p.type}: ${p.description}`)
      .join("\n");

    return `Analyze this financial data and provide 3-5 actionable insights in JSON format.

FINANCIAL OVERVIEW:
- Total Spending: $${metrics.totalSpending.toFixed(2)}
- Total Income: $${metrics.totalIncome.toFixed(2)}
- Net Cash Flow: $${metrics.netCashFlow.toFixed(2)}
- Average Monthly: $${metrics.averageMonthly.toFixed(2)}

SPENDING BREAKDOWN:
${categoryBreakdown}

DETECTED PATTERNS:
${patternSummary}

Provide insights in this EXACT JSON format:
{
  "insights": [
    {
      "title": "Short insight title",
      "description": "Detailed explanation",
      "category": "opportunity",
      "priority": 8,
      "potentialSavings": 100.50,
      "actionable": true
    }
  ]
}

Categories must be: "opportunity", "alert", or "info"
Priority must be 1-10
Focus on savings opportunities, alerts, and positive behaviors.

Return ONLY the JSON object, no other text.`;
  }

  /**
   * Parse insights from AI text response
   */
  private parseInsightsFromText(text: string): Insight[] {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonText = text.trim();
      
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      
      const result = JSON.parse(jsonText);
      return this.parseInsights(result);
    } catch (error) {
      console.warn("Could not parse JSON from AI response, using fallback");
      return [];
    }
  }

  /**
   * Parse AI response into Insight objects
   */
  private parseInsights(result: any): Insight[] {
    const insights: Insight[] = [];

    if (result.insights && Array.isArray(result.insights)) {
      result.insights.forEach((item: any) => {
        if (item.title && item.description && item.category) {
          insights.push({
            title: item.title,
            description: item.description,
            category: item.category,
            priority: item.priority || 5,
            potentialSavings: item.potentialSavings,
            actionable: item.actionable !== false,
          });
        }
      });
    }

    // Sort by priority
    return insights.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate fallback insights if AI fails
   */
  private generateFallbackInsights(
    metrics: FinancialMetrics,
    patterns: DetectedPattern[],
  ): Insight[] {
    const insights: Insight[] = [];

    // Check for negative cash flow
    if (metrics.netCashFlow < 0) {
      insights.push({
        title: "Negative Cash Flow Alert",
        description: `You're spending $${Math.abs(metrics.netCashFlow).toFixed(2)} more than you earn. Review your expenses to identify cuts.`,
        category: "alert",
        priority: 10,
        actionable: true,
      });
    }

    // Check for high spending categories
    const topCategory = metrics.categoryBreakdown[0];
    if (topCategory && topCategory.percentage > 40) {
      insights.push({
        title: `High ${topCategory.category} Spending`,
        description: `${topCategory.category} represents ${topCategory.percentage.toFixed(1)}% of your spending. Consider if this aligns with your priorities.`,
        category: "info",
        priority: 7,
        actionable: true,
      });
    }

    // Check for recurring charges
    const recurringPatterns = patterns.filter((p) => p.type === "recurring_charge");
    if (recurringPatterns.length > 0) {
      const totalRecurring = recurringPatterns.reduce((sum, p) => sum + p.impact, 0);
      insights.push({
        title: "Review Subscriptions",
        description: `You have ${recurringPatterns.length} recurring charges totaling $${(totalRecurring / 12).toFixed(2)}/month. Review for unused subscriptions.`,
        category: "opportunity",
        priority: 8,
        potentialSavings: totalRecurring / 12,
        actionable: true,
      });
    }

    return insights;
  }

  /**
   * Display insights summary
   */
  static displaySummary(insights: Insight[]): void {
    console.log("\n💡 Insights & Recommendations:");
    console.log("=".repeat(50));

    const byCategory = {
      opportunity: insights.filter((i) => i.category === "opportunity"),
      alert: insights.filter((i) => i.category === "alert"),
      info: insights.filter((i) => i.category === "info"),
    };

    if (byCategory.alert.length > 0) {
      console.log("\n🚨 ALERTS:");
      byCategory.alert.forEach((i) => {
        console.log(`  • ${i.title}`);
        console.log(`    ${i.description}`);
      });
    }

    if (byCategory.opportunity.length > 0) {
      console.log("\n💰 OPPORTUNITIES:");
      byCategory.opportunity.forEach((i) => {
        console.log(`  • ${i.title}`);
        console.log(`    ${i.description}`);
        if (i.potentialSavings) {
          console.log(`    Potential savings: $${i.potentialSavings.toFixed(2)}`);
        }
      });
    }

    if (byCategory.info.length > 0) {
      console.log("\nℹ️  INFORMATION:");
      byCategory.info.forEach((i) => {
        console.log(`  • ${i.title}`);
        console.log(`    ${i.description}`);
      });
    }

    console.log("\n" + "=".repeat(50));
  }
}