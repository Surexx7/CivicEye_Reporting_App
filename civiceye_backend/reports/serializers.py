# civiceye_backend/reports/serializers.py

from rest_framework import serializers
from .models import Report, ReportComment, Department


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Department
        fields = ['id', 'name', 'category', 'email']


class ReportCommentSerializer(serializers.ModelSerializer):
    author_email = serializers.EmailField(source='author.email', read_only=True)

    class Meta:
        model  = ReportComment
        fields = ['id', 'author_email', 'text', 'created_at']
        read_only_fields = ['id', 'author_email', 'created_at']


class ReportSerializer(serializers.ModelSerializer):
    image      = serializers.SerializerMethodField()
    comments   = ReportCommentSerializer(many=True, read_only=True)
    department = DepartmentSerializer(read_only=True)

    class Meta:
        model  = Report
        fields = [
            'id', 'title', 'description', 'location',
            'category', 'status', 'image',
            'latitude', 'longitude', 'is_sos', 'ai_detected',
            'department', 'comments',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'ai_detected', 'department']

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class ReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Report
        fields = ['title', 'description', 'location', 'category', 'image', 'latitude', 'longitude', 'is_sos']
        