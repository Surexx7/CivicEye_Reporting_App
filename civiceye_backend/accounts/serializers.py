from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


class RegisterSerializer(serializers.ModelSerializer):
    email     = serializers.EmailField(required=True)
    password  = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm Password')

    class Meta:
        model  = User
        fields = ('email', 'password', 'password2')

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return normalized

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        email = validated_data['email']
        return User.objects.create_user(username=email, email=email, password=validated_data['password'])


class UserSerializer(serializers.ModelSerializer):
    is_staff = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ('id', 'email', 'date_joined', 'is_staff')

    def get_is_staff(self, obj):
        return hasattr(obj, 'staff_profile')


class StaffLoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)