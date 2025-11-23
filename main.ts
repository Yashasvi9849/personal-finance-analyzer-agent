import {
  OpenAIModelProvider,
  ZypherAgent,
  McpServerManager,
} from "@corespeed/zypher";
import { FinancialAgent } from "./agent/financialAgent.ts";

// Manually load .env file
async function loadEnv() {
  try {
    const envContent = await Deno.readTextFile(".env");
    const lines = envContent.split("\n");
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=").trim();
        if (key && value) {
          Deno.env.set(key.trim(), value);
        }
      }
    }
  } catch (error) {
    console.warn("⚠️  Could not load .env file. Make sure it exists.");
  }
}

// Load environment variables
await loadEnv();

// Read env vars safely
function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Environment variable ${name} is not set. Check your .env file.`);
  }
  return value;
}

async function main() {
  console.log("💰 Personal Finance Analyzer Agent");
  console.log("==================================\n");

  try {
    // 1) Create model provider
    console.log("⚙️  Initializing OpenAI provider...");
    const modelProvider = new OpenAIModelProvider({
      apiKey: getRequiredEnv("OPENAI_API_KEY"),
    });
    console.log("✅ OpenAI provider created\n");

    // 2) Create MCP server manager
    console.log("⚙️  Initializing MCP server manager...");
    const mcpServerManager = new McpServerManager();
    console.log("✅ MCP server manager created\n");

    // 3) Create agent
    console.log("⚙️  Creating Zypher agent...");
    const agent = new ZypherAgent(
      modelProvider,
      undefined,
      mcpServerManager,
    );
    console.log("✅ Agent created\n");

    // 4) Create financial agent
    console.log("⚙️  Initializing Financial Agent...");
    const financialAgent = new FinancialAgent(agent, modelProvider);
    console.log("✅ Financial Agent ready\n");

    // 5) Get CSV file path
    const csvFilePath = Deno.args[0] || "./data/sample_transactions.csv";
    console.log(`📂 Using data file: ${csvFilePath}\n`);

    // 6) Run analysis
    const report = await financialAgent.analyzeFinances(csvFilePath);

    // 7) Display final report
    FinancialAgent.displayReport(report);

    // 8) Save report
    const outputPath = "./output/financial_report.json";
    await FinancialAgent.saveReport(report, outputPath);

    console.log("\n🎉 Analysis complete! Check the output directory for detailed report.\n");
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}