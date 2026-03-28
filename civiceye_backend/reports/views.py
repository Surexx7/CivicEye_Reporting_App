# civiceye_backend/reports/views.py

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .ai_detection import detect_category
from .models import Department, Report, ReportComment
from .serializers import (
    DepartmentSerializer,
    ReportCommentSerializer,
    ReportCreateSerializer,
    ReportSerializer,
)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def is_staff_user(user):
    """True if this user is linked to a department (i.e. staff)."""
    return hasattr(user, 'department')


# ─── GET /api/reports/stats/ ─────────────────────────────────────────────────
class ReportStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if is_staff_user(request.user):
            # Staff: stats for their department only
            qs = Report.objects.filter(department=request.user.department)
        else:
            # Citizen: stats for their own reports
            qs = Report.objects.filter(user=request.user)

        return Response({
            'total':       qs.count(),
            'resolved':    qs.filter(status='resolved').count(),
            'pending':     qs.filter(status='pending').count(),
            'in_progress': qs.filter(status='in_progress').count(),
        })


# ─── GET/POST /api/reports/ ───────────────────────────────────────────────────
class ReportListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if is_staff_user(request.user):
            # Staff sees only their department's reports
            qs = Report.objects.filter(department=request.user.department)
        else:
            # Citizen sees their own reports
            qs = Report.objects.filter(user=request.user)

        # Filters
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        limit = request.query_params.get('limit')
        if limit:
            try:
                qs = qs[:int(limit)]
            except ValueError:
                pass

        serializer = ReportSerializer(qs, many=True, context={'request': request})
        return Response({'count': len(serializer.data), 'results': serializer.data})

    def post(self, request):
        """Citizen submits a new report — AI detects category + assigns department."""
        if is_staff_user(request.user):
            return Response({'error': 'Staff cannot submit reports.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ReportCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        report = serializer.save(user=request.user)

        # ── AI category detection ──────────────────────────────────────────
        image_path = report.image.path if report.image else None
        detection  = detect_category(
            title=report.title,
            description=report.description,
            image_path=image_path,
        )
        detected_category = detection['category']

        # ── Assign to department ───────────────────────────────────────────
        department = Department.objects.filter(category=detected_category).first()

        report.category    = detected_category
        report.ai_detected = True
        report.department  = department
        report.save(update_fields=['category', 'ai_detected', 'department'])

        return Response(
            ReportSerializer(report, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


# ─── GET/PUT/DELETE /api/reports/<id>/ ───────────────────────────────────────
class ReportDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_report(self, pk, user):
        try:
            if is_staff_user(user):
                return Report.objects.get(pk=pk, department=user.department)
            return Report.objects.get(pk=pk, user=user)
        except Report.DoesNotExist:
            return None

    def get(self, request, pk):
        report = self._get_report(pk, request.user)
        if not report:
            return Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ReportSerializer(report, context={'request': request}).data)

    def put(self, request, pk):
        """Staff: update status. Citizen: cannot update."""
        if not is_staff_user(request.user):
            return Response({'error': 'Only staff can update reports.'}, status=status.HTTP_403_FORBIDDEN)

        report = self._get_report(pk, request.user)
        if not report:
            return Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

        allowed = {k: v for k, v in request.data.items() if k in ('status',)}
        for field, value in allowed.items():
            setattr(report, field, value)
        report.save()

        return Response(ReportSerializer(report, context={'request': request}).data)

    def delete(self, request, pk):
        if is_staff_user(request.user):
            return Response({'error': 'Staff cannot delete reports.'}, status=status.HTTP_403_FORBIDDEN)
        report = self._get_report(pk, request.user)
        if not report:
            return Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)
        report.delete()
        return Response({'message': 'Deleted.'}, status=status.HTTP_204_NO_CONTENT)


# ─── POST /api/reports/<id>/comments/ ────────────────────────────────────────
class ReportCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """Staff adds a comment/update to a report."""
        if not is_staff_user(request.user):
            return Response({'error': 'Only staff can comment.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            report = Report.objects.get(pk=pk, department=request.user.department)
        except Report.DoesNotExist:
            return Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReportCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(report=report, author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── POST /api/reports/sos/ ──────────────────────────────────────────────────
class SOSReportView(APIView):
    """Emergency report — sent to ALL departments simultaneously."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ReportCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Create one master report
        report = serializer.save(
            user=request.user,
            is_sos=True,
            category='other',
            title=request.data.get('title', 'SOS Emergency'),
        )

        # Duplicate to every department
        all_departments = Department.objects.all()
        created = []
        for dept in all_departments:
            r = Report.objects.create(
                user=request.user,
                department=dept,
                title=report.title,
                description=report.description,
                location=report.location,
                category='other',
                is_sos=True,
                latitude=report.latitude,
                longitude=report.longitude,
            )
            created.append(r.id)

        report.delete()  # remove the orphan master

        return Response({
            'message': 'SOS sent to all departments.',
            'report_ids': created,
        }, status=status.HTTP_201_CREATED)


# ─── GET /api/departments/ ────────────────────────────────────────────────────
class DepartmentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        depts = Department.objects.all()
        return Response(DepartmentSerializer(depts, many=True).data)


# ─── Staff profile ────────────────────────────────────────────────────────────
class StaffProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_staff_user(request.user):
            return Response({'error': 'Not a staff account.'}, status=status.HTTP_403_FORBIDDEN)
        dept = request.user.department
        return Response({
            'email':      request.user.email,
            'department': DepartmentSerializer(dept).data,
        })
    