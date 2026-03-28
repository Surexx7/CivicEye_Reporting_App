# civiceye_backend/reports/ai_detection.py
"""
Uses Google Gemini API to detect the issue category from
the report title + description and optionally image.

Returns one of:
  electricity | water | garbage | roads | vandalism | other
"""

import json
from pathlib import Path

import google.generativeai as genai
from PIL import Image

# Initialize with the user-provided Gemini API key
genai.configure(api_key="AIzaSyANd6e3q9i0MLp_rxvhmbWwUjeFBqjchIo")

# Using the recommended model for multimodal text and image tasks
model = genai.GenerativeModel('gemini-1.5-flash')

VALID_CATEGORIES = {'electricity', 'water', 'garbage', 'roads', 'vandalism', 'other'}

SYSTEM_PROMPT = """You are a civic issue classifier for CivicEye, a citizen reporting app.

Given a report title, description, and optionally an image, classify the issue into EXACTLY ONE of these categories:
- electricity  (street lights, power outage, electrical hazards)
- water        (water leakage, drainage, flooding, sewage)
- garbage      (uncollected waste, illegal dumping, overflowing bins)
- roads        (potholes, damaged roads, broken pavements, traffic signs)
- vandalism    (graffiti, damaged public property, broken benches/fences)
- other        (anything that doesn't fit above, or no specific category detectable)

Respond with ONLY a valid JSON object in this exact format:
{"category": "roads", "confidence": 0.92, "reason": "Report describes pothole damage"}

No extra text. Only the JSON object."""

def detect_category(title: str, description: str, image_path: str = None) -> dict:
    """
    Returns dict: { category, confidence, reason }
    Falls back to 'other' on any error.
    """
    try:
        content_parts = [SYSTEM_PROMPT]
        
        # Add text
        text_prompt = f"\nTitle: {title or 'No title'}\nDescription: {description or 'No description'}"
        content_parts.append(text_prompt)

        # Add image if available
        if image_path and Path(image_path).exists():
            img = Image.open(image_path)
            content_parts.append(img)
            
        print(f"[AI Detection] Sending request to Gemini for title: '{title}'...")

        response = model.generate_content(content_parts)
        raw = response.text.strip()
        
        # Strip markdown fences if present in 
        if raw.startswith('```'):
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]
        
        # In case there's any trailing backticks in the 
        raw = raw.replace('```', '').strip()
            
        result = json.loads(raw)

        category = result.get('category', 'other').lower()
        if category not in VALID_CATEGORIES:
            category = 'other'

        print(f"[AI Detection Success] Determined category: {category} (Confidence: {result.get('confidence')})")

        return {
            'category':   category,
            'confidence': float(result.get('confidence', 0.0)),
            'reason':     result.get('reason', ''),
        }

    except Exception as e:
        print(f"[AI Detection Error] {e}")
        return {'category': 'other', 'confidence': 0.0, 'reason': str(e)}