import asyncio
import os
import json
import re
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure current directory is in path for imports
sys.path.insert(0, str(Path(__file__).parent))

# Load .env from the same directory as this file
env_path = Path(__file__).parent / '.env'
print(f"🔧 Loading .env from: {env_path}")
print(f"   .env exists: {env_path.exists()}")

if env_path.exists():
    with open(env_path, 'r') as f:
        print(f"   .env contents:\n{f.read()}")

result = load_dotenv(dotenv_path=env_path, override=True)
print(f"   load_dotenv returned: {result}")

# Verify the key is loaded
dedalus_key = os.environ.get('DEDALUS_API_KEY')
print(f"🔐 DEDALUS_API_KEY after load_dotenv: {bool(dedalus_key)}")
if dedalus_key:
    print(f"   First 20 chars: {dedalus_key[:20]}...")

try:
    from ocr_model import OCRModel
    HAS_OCR_MODEL = True
except ImportError as e:
    print(f"⚠️  Could not import OCRModel: {e}")
    HAS_OCR_MODEL = False
    OCRModel = None

try:
    from dedalus_labs import AsyncDedalus, DedalusRunner
    HAS_DEDALUS = True
except ImportError:
    HAS_DEDALUS = False


class ReceiptExtractor:
    """Extract only total amount and merchant name from receipt"""
    
    def __init__(self):
        self.api_key = os.environ.get('DEDALUS_API_KEY')
        self.ocr_key = os.environ.get('DEDALUS_OCR_API_KEY', os.environ.get('DEDALUS_API_KEY'))
        
        print(f"\n📋 ReceiptExtractor.__init__():")
        print(f"   self.api_key: {bool(self.api_key)} ({self.api_key[:20] if self.api_key else 'None'}...)")
        print(f"   self.ocr_key: {bool(self.ocr_key)} ({self.ocr_key[:20] if self.ocr_key else 'None'}...)")
        print(f"   HAS_OCR_MODEL: {HAS_OCR_MODEL}")
        print(f"   HAS_DEDALUS: {HAS_DEDALUS}")
        
        if self.ocr_key and HAS_OCR_MODEL and OCRModel:
            self.ocr_model = OCRModel(self.ocr_key)
            print(f"   ✅ OCR Model initialized successfully")
        else:
            print(f"   ⚠️  OCR Model NOT initialized")
            print(f"      - has ocr_key: {bool(self.ocr_key)}")
            print(f"      - HAS_OCR_MODEL: {HAS_OCR_MODEL}")
            print(f"      - OCRModel: {OCRModel is not None}")
            self.ocr_model = None
    
    async def extract_from_bytes(self, file_bytes: bytes, filename: str) -> dict:
        """
        Extract merchant and total from receipt file bytes
        
        Args:
            file_bytes: File content as bytes
            filename: Original filename
        
        Returns:
            dict: {"merchant": str, "total": float, "date": str}
        """
        
        print(f"📸 Processing: {filename}")
        
        # Save temp file
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(filename).suffix) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        
        try:
            # Step 1: OCR
            if self.ocr_model:
                print("🔍 Extracting text...")
                receipt_text = self.ocr_model.extract_text(tmp_path)
            else:
                print("⚠️  OCR API key not configured, using placeholder")
                receipt_text = "Receipt text extraction requires DEDALUS_API_KEY"
            
            # Step 2: Parse with LLM
            print("🤖 Extracting merchant and total...")
            result = await self._parse_total_and_merchant(receipt_text)
            
            return result
        finally:
            # Clean up temp file
            try:
                os.remove(tmp_path)
            except:
                pass
    
    async def _parse_total_and_merchant(self, receipt_text: str) -> dict:
        """Use LLM to extract merchant name and total amount"""
        # If Dedalus LLM isn't available, attempt a local regex-based parse
        def _parse_local(text: str) -> dict:
            lines = [l.strip() for l in text.splitlines() if l.strip()]

            # Merchant heuristics: first few lines that look like a store name
            merchant = None
            for line in lines[:6]:
                if len(line) < 3:
                    continue
                if re.search(r'\b(total|subtotal|tax|change|amount|visa|mastercard)\b', line, re.I):
                    continue
                if re.search(r'\d', line):
                    # skip lines that contain digits (likely address/phone)
                    continue
                merchant = line
                break
            if not merchant and lines:
                merchant = lines[0]

            # Amount heuristics
            total = None
            # 1) look for explicit 'total' label
            m = re.search(r'total[^0-9A-Za-z\$\,\.]*(?:\$)?\s*([0-9\.,]+)', text, re.I)
            if m:
                num = m.group(1)
                try:
                    total = float(num.replace(',', ''))
                except Exception:
                    total = None

            # 2) look for dollar amounts, pick the largest (often total)
            if total is None:
                dollars = re.findall(r'\$\s*([0-9]+(?:\.[0-9]{2})?)', text)
                nums = []
                for d in dollars:
                    try:
                        nums.append(float(d))
                    except:
                        pass
                if nums:
                    total = max(nums)

            # 3) fallback: any numeric-looking values
            if total is None:
                all_nums = re.findall(r'([0-9]+(?:\.[0-9]{2}))', text)
                nums = []
                for n in all_nums:
                    try:
                        nums.append(float(n))
                    except:
                        pass
                if nums:
                    total = max(nums)

            # Date heuristics
            date_str = None
            # ISO
            m = re.search(r'(\d{4}-\d{2}-\d{2})', text)
            if m:
                date_str = m.group(1)
            else:
                # mm/dd/yyyy or dd/mm/yyyy
                m = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text)
                if m:
                    raw = m.group(1)
                    for fmt in ['%m/%d/%Y', '%m-%d-%Y', '%d/%m/%Y', '%d-%m-%Y', '%m/%d/%y', '%d/%m/%y']:
                        try:
                            from datetime import datetime as _dt
                            dt = _dt.strptime(raw, fmt)
                            date_str = dt.date().isoformat()
                            break
                        except Exception:
                            continue
                else:
                    # month name
                    m = re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*[\s\.,-]*\d{1,2}[,\s]*\d{4}', text, re.I)
                    if m:
                        raw = m.group(0)
                        try:
                            from dateutil import parser as _p
                            dt = _p.parse(raw)
                            date_str = dt.date().isoformat()
                        except Exception:
                            date_str = None

            parsed = {
                'merchant': merchant or None,
                'total': float(total) if total is not None else None,
                'date': date_str or None
            }
            print(f"🔎 Local parse result: {parsed}")
            return parsed

        # Prefer local parse first (works without LLM); then try LLM if available
        local = _parse_local(receipt_text)
        if (local.get('total') is not None) or (local.get('merchant') is not None):
            return local

        # If we reach here and LLM is not available, return placeholder
        if not HAS_DEDALUS or not self.api_key:
            print("⚠️  LLM not configured and local parse failed, returning mock extraction")
            return {
                "merchant": "Sample Store",
                "total": 45.99,
                "date": "2025-02-06"
            }

        # Otherwise try using the Dedalus LLM
        try:
            client = AsyncDedalus()
            runner = DedalusRunner(client)

            prompt = f"""
Extract ONLY the merchant name and total amount from this receipt text.

Receipt Text:
{receipt_text}

Return ONLY this JSON format:
{{
    "merchant": "merchant name or null",
    "total": numeric amount or null,
    "date": "YYYY-MM-DD or null"
}}

Rules:
- merchant: Store/restaurant name
- total: Final total amount (not subtotal)
- date: Transaction date if visible
- If not found, set to null
- Return ONLY JSON, no other text
            """

            response = await runner.run(
                input=prompt,
                model="anthropic/claude-opus-4-6",
            )

            # Parse JSON
            try:
                result = json.loads(response.final_output)
            except json.JSONDecodeError:
                json_match = re.search(r'\{.*\}', str(response.final_output), re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group())
                else:
                    result = {"merchant": None, "total": None, "date": None}

            return result
        except Exception as e:
            print(f"⚠️  LLM extraction failed: {e}, falling back to local parse/mocks")
            return local or {
                "merchant": "Sample Store",
                "total": 45.99,
                "date": "2025-02-06"
            }
