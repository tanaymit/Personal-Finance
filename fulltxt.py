import asyncio
import os
import json
from dotenv import load_dotenv
from ocr_model import OCRModel
from dedalus_labs import AsyncDedalus, DedalusRunner

load_dotenv()


class BankStatementExtractor:
    """Extract transactions from bank statement PDF/Image"""

    def __init__(self):
        self.api_key = os.environ.get("DEDALUS_API_KEY")
        if not self.api_key:
            raise ValueError("DEDALUS_API_KEY not found in .env")

        self.ocr_model = OCRModel(self.api_key)

    async def extract_transactions(self, path_or_url: str) -> dict:
        print(f"📄 Reading: {path_or_url}")
        print("🔍 Running OCR...")

        # Step 1: OCR
        document_text = self.ocr_model.extract_text(path_or_url)

        print("🤖 Extracting transactions with LLM...")

        # Step 2: LLM
        client = AsyncDedalus()
        runner = DedalusRunner(client)

        prompt = f"""
Extract all transactions from the provided bank statement document and return them in structured JSON format.

Instructions:

1. Identify every transaction row in the document.
2. Ignore headers, summaries, balances, and page decorations.
3. Each transaction must contain:
   - date
   - merchant or description
   - amount
4. Preserve merchant/description text as shown.
5. Convert dates to YYYY-MM-DD format if possible.
6. Amount rules:
   - Money spent must be negative.
   - Money received must be positive.
7. Remove currency symbols and commas.
8. The different categories are Entertainment,Subscriptions,Groceries,Restaurant and Dining, Discretionary.
9. Combine multi-line transaction descriptions into one line.
10. Output valid JSON only.
11. Do not include explanations.

Return output in this format:

{{
  "transactions": [
    {{
      "date": "YYYY-MM-DD",
      "merchant": "merchant or description",
      "amount": -23.45
      "Category":Entertainment
    }}
  ]
}}

Ensure all transactions are included and listed in chronological order when possible.

Document Text:
{document_text}
"""


        response = await runner.run(
            input=prompt,
            model="anthropic/claude-opus-4-6",
        )

        # Step 3: Parse JSON safely
        try:
            result = json.loads(response.final_output)
        except json.JSONDecodeError:
            import re
            match = re.search(r"\{.*\}", response.final_output, re.DOTALL)
            result = json.loads(match.group()) if match else {"transactions": []}

        return result


async def main():
    extractor = BankStatementExtractor()

    file_path = r"C:\Users\Dell\Desktop\Hackathon\WhatsApp Image 2026-02-07 at 08.30.09.jpeg"
    # file_path = r"C:\Users\Dell\Desktop\Hackathon\WhatsApp Image.jpeg"

    result = await extractor.extract_transactions(file_path)

    print("\n" + "=" * 60)
    print("📊 TRANSACTIONS JSON")
    print("=" * 60)
    print(json.dumps(result, indent=2))
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
