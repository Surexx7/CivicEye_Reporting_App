import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civiceye_backend.settings')
django.setup()

from reports.models import Report
from reports.ai_detection import detect_category

# Get the latest report
report = Report.objects.last()
if report:
    print(f"Latest Report ID: {report.id}")
    image_path = report.image.path if report.image else None
    print(f"Image path: {image_path}")
    
    res = detect_category(report.title, report.description, image_path)
    print("AI Result:", res)
else:
    print("No reports found.")
