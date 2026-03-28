# civiceye_backend/reports/models.py

from django.contrib.auth.models import User
from django.db import models


# ─── Department categories (must match AI detection labels) ───────────────────
CATEGORY_CHOICES = [
    ('electricity', 'Electricity / Street Lights'),
    ('water',       'Water / Drainage'),
    ('garbage',     'Garbage / Waste'),
    ('roads',       'Roads / Potholes'),
    ('vandalism',   'Vandalism / Public Property'),
    ('other',       'Other'),
]

STATUS_CHOICES = [
    ('pending',     'Pending'),
    ('in_progress', 'In Progress'),
    ('resolved',    'Resolved'),
]


class Department(models.Model):
    """
    Created only by admin.
    Each department has one staff user account.
    """
    name       = models.CharField(max_length=100, unique=True)
    category   = models.CharField(max_length=50, choices=CATEGORY_CHOICES, unique=True)
    staff_user = models.OneToOneField(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='department',
        help_text='The staff account that manages this department',
    )
    email      = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Report(models.Model):
    """Submitted by a citizen user."""
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    department  = models.ForeignKey(
        Department, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reports',
    )
    title       = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    location    = models.CharField(max_length=300)
    category    = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    image       = models.ImageField(upload_to='reports/', blank=True, null=True)
    latitude    = models.FloatField(null=True, blank=True)
    longitude   = models.FloatField(null=True, blank=True)
    is_sos      = models.BooleanField(default=False)
    ai_detected = models.BooleanField(default=False)  # was category AI-detected?
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.category}] {self.title} — {self.status}"


class ReportComment(models.Model):
    """Department staff can add comments / status updates."""
    report     = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='comments')
    author     = models.ForeignKey(User, on_delete=models.CASCADE)
    text       = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment on Report#{self.report_id} by {self.author.email}"
    