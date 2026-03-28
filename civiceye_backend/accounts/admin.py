from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import StaffProfile

# Unregister default User admin
admin.site.unregister(User)

# -----------------------------
# Custom User Admin
# -----------------------------
@admin.register(User)
class CivicUserAdmin(UserAdmin):
    """
    Customised admin view for CivicEye users.
    Shows email prominently since that's the login identifier.
    """
    list_display  = ('email', 'username', 'date_joined', 'is_active', 'is_staff')
    list_filter   = ('is_active', 'is_staff', 'date_joined')
    search_fields = ('email', 'username')
    ordering      = ('-date_joined',)

    fieldsets = (
        (None, {
            'fields': ('username', 'email', 'password'),
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {
            'fields': ('last_login', 'date_joined'),
        }),
    )

# -----------------------------
# Staff Profile Admin
# -----------------------------
@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display  = ('user', 'department', 'created_by')
    list_filter   = ('department',)
    search_fields = ('user__username', 'user__email')

    # When creating, only show users who don't already have a staff profile
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'user':
            # Exclude users that already have a staff profile
            existing = StaffProfile.objects.values_list('user_id', flat=True)
            kwargs['queryset'] = User.objects.exclude(id__in=existing)

        if db_field.name == 'created_by':
            kwargs['queryset'] = User.objects.filter(is_superuser=True)

        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    # Automatically set created_by to the logged-in admin
    def save_model(self, request, obj, form, change):
        if not change:  # only on creation
            obj.created_by = request.user
        super().save_model(request, obj, form, change)