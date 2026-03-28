# civiceye_backend/civiceye/urls.py

from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static


def home(request):
    return HttpResponse("CivicEye API is Running✓")


urlpatterns = [
    path('',              home),
    path('admin/',        admin.site.urls),
    path('api/auth/',     include('accounts.urls')),
    path('api/reports/',  include('reports.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)