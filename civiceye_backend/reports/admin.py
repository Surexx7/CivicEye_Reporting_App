# civiceye_backend/reports/admin.py

from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from .models import Department, Report, ReportComment


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display  = ['name', 'category', 'email', 'staff_user']
    list_filter   = ['category']

    def save_model(self, request, obj, form, change):
        """
        Auto-creates a staff User account when a Department is created
        if no staff_user is assigned yet.
        Usage: just fill in name, category, email — a user is auto-created
               with email as username and a default password 'CivicEye@2024'
               (staff should change this on first login).
        """
        if not obj.pk and not obj.staff_user:
            username = obj.email or f"{obj.category}_staff"
            if not User.objects.filter(username=username).exists():
                staff = User.objects.create(
                    username=username,
                    email=obj.email,
                    password=make_password('CivicEye@2024'),
                    is_staff=False,
                    is_active=True,
                )
                obj.staff_user = staff
        super().save_model(request, obj, form, change)


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display  = ['title', 'category', 'status', 'department', 'is_sos', 'created_at']
    list_filter   = ['status', 'category', 'department', 'is_sos']
    search_fields = ['title', 'description', 'location']
    readonly_fields = ['ai_detected', 'created_at', 'updated_at']


@admin.register(ReportComment)
class ReportCommentAdmin(admin.ModelAdmin):
    list_display = ['report', 'author', 'created_at']
    