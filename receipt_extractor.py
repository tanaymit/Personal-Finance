import asyncio
import os
from dotenv import load_dotenv
from dedalus_labs import AsyncDedalus, DedalusRunner
from ocr_model import OCRModel
import json

load_dotenv()


class ReceiptExtractor:
    """Extract only total amount and merchant name from receipt"""
    
    def __init__(self):
        self.api_key = os.environ.get('DEDALUS_API_KEY')
        if not self.api_key:
            raise ValueError("DEDALUS_API_KEY not found in .env")
        
        self.ocr_model = OCRModel(self.api_key)
    
    async def extract_total_and_title(self, image_path: str) -> dict:
        """
        Extract ONLY total amount and merchant name
        
        Args:
            image_path: Path to receipt image
        
        Returns:
            dict: {"merchant": str, "total": float}
        """
        
        print(f"📸 Processing: {image_path}")
        
        # Step 1: OCR
        print("🔍 Extracting text...")
        receipt_text = self.ocr_model.extract_text(image_path)
        
        # Step 2: Parse with LLM
        print("🤖 Extracting total and merchant...")
        result = await self._parse_total_and_title(receipt_text)
        
        return result
    
    async def _parse_total_and_title(self, receipt_text: str) -> dict:
        """Use LLM to extract only total and merchant name"""
        
        client = AsyncDedalus()
        runner = DedalusRunner(client)
        
        prompt = f"""
        Extract ONLY the name and total amount from this receipt.
        
        Receipt Text:
        {receipt_text}
        
        Return ONLY this JSON format:
        {{
            "merchant": "merchant name or null",
            "total": numeric amount or null
        }}
        
        Rules:
        - merchant: The store/restaurant name at the top
        - total: The final total amount (not subtotal or tax)
        - If you can't find either, set to null
        - Return ONLY the JSON, nothing else
        """
        
        response = await runner.run(
            input=prompt,
            model="anthropic/claude-opus-4-6",
        )
        
        # Parse JSON
        try:
            result = json.loads(response.final_output)
        except json.JSONDecodeError:
            import re
            json_match = re.search(r'\{.*\}', response.final_output, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                result = {"merchant": None, "total": None}
        
        return result


async def main():
    extractor = ReceiptExtractor()
    
    # Extract from receipt
    result = await extractor.extract_total_and_title("WhatsApp Image 2026-02-07 at 08.30.09.jpeg")    
    # Display
    print("\n" + "="*50)
    print("📊 EXTRACTED DATA")
    print("="*50)
    print(f"Merchant: {result['merchant']}")
    print(f"Total: ${result['total']}")
    print("="*50 + "\n")


if __name__ == "__main__":
    asyncio.run(main())