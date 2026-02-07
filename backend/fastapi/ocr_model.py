import httpx
import base64
from pathlib import Path
import time


class OCRModel:
    """OCR Model for extracting text from images or PDFs via Dedalus"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.api_url = "https://api.dedaluslabs.ai/v1/ocr"
        self.model = "mistral-ocr-latest"

    # -------- MIME TYPE --------
    # Dedalus expects application/* even for images
    def _get_media_type(self, file_path: str) -> str:
        return "application/pdf"   # force for all files

    # -------- OCR FUNCTION --------
    def extract_text(self, path_or_url: str) -> str:
        """Extract text from local file OR HTTPS URL"""

        # -------- CASE 1: URL --------
        if path_or_url.lower().startswith("http"):
            document_payload = {
                "type": "document_url",
                "document_url": path_or_url
            }

        # -------- CASE 2: LOCAL FILE --------
        else:
            with open(path_or_url, "rb") as f:
                base64_data = base64.b64encode(f.read()).decode()

            if not base64_data:
                raise ValueError("Failed to encode file")

            media_type = self._get_media_type(path_or_url)

            document_payload = {
                "type": "document_url",
                "document_url": f"data:{media_type};base64,{base64_data}"
            }

        # -------- OCR CALL WITH RETRIES --------
        response = None
        for attempt in range(3):
            response = httpx.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "document": document_payload
                },
                timeout=120.0,
            )

            if response.status_code == 200:
                break

            print(f"Retry {attempt+1} - API Error {response.status_code}")
            time.sleep(2)

        # -------- FINAL STATUS CHECK --------
        if response is None or response.status_code != 200:
            print(response.text if response else "No response")
            raise Exception("OCR API failed after retries")

        # -------- PARSE RESPONSE --------
        result = response.json()

        # -------- EXTRACT TEXT --------
        text = ""
        if "pages" in result:
            for page in result["pages"]:
                text += page.get("markdown") or page.get("text", "")
        else:
            text = result.get("text", "")

        return text.strip()
