from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import UserRateThrottle
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Prefetch

User = get_user_model()

from .models import UserProfile, WorkSession, ActivityLog
from .serializers import (
    UserProfileSerializer,
    WorkSessionSerializer,
    EmployeeStatusSerializer,
    HeartbeatRequestSerializer,
    HeartbeatResponseSerializer,
)
from .utils import (
    is_tracking_enabled,
    get_or_create_active_session,
    update_session_ping,
    close_session,
    get_employee_status,
    get_all_employees_status,
    toggle_tracking,
)


class HeartbeatThrottle(UserRateThrottle):
    """Rate limit heartbeat API to prevent abuse."""
    scope = 'heartbeat'
    rate = '60/minute'  # 1 per second


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def heartbeat(request):
    """
    Heartbeat API endpoint.
    
    Updates last_ping for user's active session if tracking is enabled.
    Creates new session if none exists.
    """
    user = request.user
    
    # Check if tracking is enabled
    if not is_tracking_enabled(user):
        return Response(
            {
                'success': False,
                'message': 'Tracking is disabled for user',
                'session_id': None,
                'status': 'Offline',
            },
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Get or create active session
        session, created = get_or_create_active_session(user)
        
        # Update last_ping
        session = update_session_ping(session)
        
        # Get current status
        current_status = session.get_status()
        
        return Response(
            {
                'success': True,
                'message': 'Heartbeat recorded' if not created else 'New session created',
                'session_id': session.id,
                'status': current_status,
            },
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': f'Error: {str(e)}',
                'session_id': None,
                'status': 'Offline',
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout endpoint.
    
    Closes the active session for the current user.
    """
    user = request.user
    
    try:
        session = WorkSession.objects.get(
            user=user,
            is_active_session=True
        )
        session = close_session(session)
        
        return Response(
            {
                'success': True,
                'message': 'Session closed',
                'session_id': session.id,
            },
            status=status.HTTP_200_OK
        )
    except WorkSession.DoesNotExist:
        return Response(
            {
                'success': False,
                'message': 'No active session found',
            },
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {
                'success': False,
                'message': f'Error: {str(e)}',
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_status(request, user_id=None):
    """
    Get detailed status for one or all employees.
    
    Query params:
        - user_id: Get status for specific user (optional)
    """
    if user_id:
        # Get specific user status
        user = get_object_or_404(User, id=user_id)
        status_data = get_employee_status(user)
        serializer = EmployeeStatusSerializer(status_data)
        return Response(serializer.data, status=status.HTTP_200_OK)
    else:
        # Get all active users status
        try:
            employees_status = get_all_employees_status()
            serializer = EmployeeStatusSerializer(employees_status, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_user_tracking(request, user_id):
    """
    Toggle tracking for a specific user.
    
    Body (optional):
        - enabled: true/false (if omitted, toggles current state)
    """
    user = get_object_or_404(User, id=user_id)
    
    # Check permissions: user can only toggle own, admin can toggle any
    if request.user.id != user.id and not request.user.is_staff:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        enabled = request.data.get('enabled', None)
        profile = toggle_tracking(user, enable=enabled)
        
        serializer = UserProfileSerializer(profile)
        return Response(
            {
                'success': True,
                'message': f'Tracking {"enabled" if profile.is_tracking_enabled else "disabled"}',
                'data': serializer.data,
            },
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_tracking_status(request):
    """
    Get current user's tracking status.
    """
    user = request.user
    
    try:
        profile = UserProfile.objects.select_related('user').get(user=user)
    except UserProfile.DoesNotExist:
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
    serializer = UserProfileSerializer(profile)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_track_enable(request):
    """
    Set tracking enabled/disabled for current user.
    
    Body:
        - enabled: true/false
    """
    user = request.user
    enabled = request.data.get('enabled')
    
    if enabled is None:
        return Response(
            {'error': 'enabled parameter required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        profile = toggle_tracking(user, enable=enabled)
        serializer = UserProfileSerializer(profile)
        return Response(
            {
                'success': True,
                'message': f'Tracking {"enabled" if profile.is_tracking_enabled else "disabled"}',
                'data': serializer.data,
            },
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class UserProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for UserProfile management."""
    queryset = UserProfile.objects.select_related('user')
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter by current user unless admin."""
        if self.request.user.is_staff:
            return UserProfile.objects.select_related('user')
        return UserProfile.objects.filter(user=self.request.user)


class WorkSessionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for WorkSession viewing."""
    queryset = WorkSession.objects.select_related('user')
    serializer_class = WorkSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter by current user unless admin."""
        user_id = self.request.query_params.get('user_id')
        
        if self.request.user.is_staff:
            if user_id:
                return WorkSession.objects.filter(user_id=user_id).select_related('user')
            return WorkSession.objects.select_related('user')
        
        return WorkSession.objects.filter(user=self.request.user).select_related('user')

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active session for user."""
        try:
            session = WorkSession.objects.get(
                user=request.user,
                is_active_session=True
            )
            serializer = self.get_serializer(session)
            return Response(serializer.data)
        except WorkSession.DoesNotExist:
            return Response(
                {'message': 'No active session'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get all sessions for today."""
        today = timezone.now().date()
        sessions = WorkSession.objects.filter(
            user=request.user,
            login_time__date=today
        ).select_related('user')
        
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)
