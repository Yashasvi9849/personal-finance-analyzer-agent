## A financial analysis agent that makes intelligent decisions about what to 
analyze rather than following a fixed script. The agent autonomously creates 
analysis plans based on dataset size, discovers patterns like recurring charges 
and spending spikes, and generates prioritized recommendations with potential 
savings calculations.##
##  How to Run This Project

### Prerequisites
- Deno v1.40+ ([Install here](https://deno.land/))
- OpenAI API Key ([Get key](https://platform.openai.com/api-keys))

### Setup Steps

1. **Clone the repository**
```bash
   git clone https://github.com/YOUR_USERNAME/personal-finance-analyzer-agent.git
   cd personal-finance-analyzer-agent
```

2. **Create `.env` file with your OpenAI API key**
```bash
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
```
   Replace `your_openai_api_key_here` with your actual API key.

3. **Run the agent**
```bash
   # Use default sample data
   deno task start

   # Or specify a CSV file
   deno task start data/basic_consumer.csv
   deno task start data/tech_professional.csv
   deno task start path/to/your/transactions.csv
```

### CSV File Format
Your CSV must have these columns:
```csv
Date,Description,Amount,Type
2024-01-05,Starbucks Coffee,5.50,debit
2024-01-06,Salary Deposit,3500.00,credit
```

### Output
Results are displayed in console and saved to `output/financial_report.json`
