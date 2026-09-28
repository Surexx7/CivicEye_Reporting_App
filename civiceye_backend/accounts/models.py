from django.contrib.auth.models import User
from django.db import models

# Create your models here.

DEPARTMENT_CHOICES = [
    ('electricity', 'Electricity'),
    ('water',       'Water'),
    ('garbage',     'Garbage'),
    ('roads',       'Roads'),
    ('other',       'Other'),
]

class StaffProfile(models.Model):
    user       = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_staff')

    def __str__(self):
        return f"{self.user.email} — {self.department}"