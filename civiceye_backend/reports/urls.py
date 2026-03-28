# civiceye_backend/reports/urls.py

from django.urls import path
from .views import (
    DepartmentListView,
    ReportCommentView,
    ReportDetailView,
    ReportListCreateView,
    ReportStatsView,
    SOSReportView,
    StaffProfileView,
)

urlpatterns = [
    path('stats/',           ReportStatsView.as_view(),       name='report-stats'),
    path('',                 ReportListCreateView.as_view(),   name='report-list-create'),
    path('<int:pk>/',        ReportDetailView.as_view(),       name='report-detail'),
    path('<int:pk>/comments/', ReportCommentView.as_view(),    name='report-comment'),
    path('sos/',             SOSReportView.as_view(),          name='report-sos'),
    path('departments/',     DepartmentListView.as_view(),     name='department-list'),
    path('staff/profile/',   StaffProfileView.as_view(),       name='staff-profile'),
]
