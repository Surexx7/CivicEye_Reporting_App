from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import LoginView, LogoutView, MeView, RegisterView, StaffLoginView

urlpatterns = [
    path('register/',     RegisterView.as_view(),    name='auth-register'),
    path('login/',        LoginView.as_view(),        name='auth-login'),
    path('staff-login/',  StaffLoginView.as_view(),   name='auth-staff-login'),  # NEW
    path('logout/',       LogoutView.as_view(),        name='auth-logout'),
    path('refresh/',      TokenRefreshView.as_view(), name='auth-refresh'),
    path('me/',           MeView.as_view(),            name='auth-me'),
]