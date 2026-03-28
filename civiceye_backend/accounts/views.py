from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import RegisterSerializer, UserSerializer, StaffLoginSerializer


def _token_pair(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access':  str(refresh.access_token),
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user   = serializer.save()
            tokens = _token_pair(user)
            return Response(
                {'message': 'Account created successfully.', 'user': UserSerializer(user).data, **tokens},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email    = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '').strip()

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'error': 'No account found with this email address.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'error': 'Incorrect password. Please try again.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'This account has been deactivated.'}, status=status.HTTP_403_FORBIDDEN)

        # Block staff accounts from using the citizen login
        if hasattr(user, 'staff_profile'):
            return Response({'error': 'Staff accounts must use the department login.'}, status=status.HTTP_403_FORBIDDEN)

        tokens = _token_pair(user)
        return Response(
            {'message': 'Login successful.', 'user': UserSerializer(user).data, **tokens},
            status=status.HTTP_200_OK,
        )


# ─── NEW: Department staff login ──────────────────────────────────────────────
class StaffLoginView(APIView):
    """
    Login endpoint exclusively for department staff.
    Uses username (not email) since admin creates these accounts.
    Returns is_staff: true in the response.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = StaffLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        username = serializer.validated_data['username'].strip()
        password = serializer.validated_data['password'].strip()

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'This account has been deactivated.'}, status=status.HTTP_403_FORBIDDEN)

        # Must have a StaffProfile to use this endpoint
        if not hasattr(user, 'staff_profile'):
            return Response({'error': 'This account does not have staff access.'}, status=status.HTTP_403_FORBIDDEN)

        tokens = _token_pair(user)
        return Response(
            {
                'message':    'Staff login successful.',
                'user':       UserSerializer(user).data,
                'is_staff':   True,
                'department': user.staff_profile.department,
                **tokens,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            RefreshToken(refresh_token).blacklist()
        except (TokenError, Exception):
            pass
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)