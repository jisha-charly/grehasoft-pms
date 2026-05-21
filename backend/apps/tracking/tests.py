"""
TESTING GUIDE FOR WORK TRACKING SYSTEM

This module provides test cases for the tracking system.
"""

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

from .models import UserProfile, WorkSession, ActivityLog
from .utils import (
    get_or_create_user_profile,
    is_tracking_enabled,
    get_or_create_active_session,
    update_session_ping,
    calculate_daily_working_time,
    format_duration,
    get_employee_status,
    toggle_tracking,
    auto_logout_inactive_users,
)


class UserProfileModelTest(TestCase):
    """Test UserProfile model."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_create_user_profile(self):
        """Test creating a user profile."""
        UserProfile.objects.filter(user=self.user).delete()
        profile = UserProfile.objects.create(
            user=self.user,
            is_tracking_enabled=True
        )
        self.assertTrue(profile.is_tracking_enabled)
        self.assertEqual(profile.user, self.user)

    def test_user_profile_default_tracking_disabled(self):
        """Test that tracking is disabled by default."""
        UserProfile.objects.filter(user=self.user).delete()
        profile = UserProfile.objects.create(user=self.user)
        self.assertFalse(profile.is_tracking_enabled)

    def test_unique_one_to_one_relationship(self):
        """Test OneToOne constraint."""
        UserProfile.objects.filter(user=self.user).delete()
        UserProfile.objects.create(user=self.user)
        with self.assertRaises(Exception):
            UserProfile.objects.create(user=self.user)


class WorkSessionModelTest(TestCase):
    """Test WorkSession model."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_create_work_session(self):
        """Test creating a work session."""
        session = WorkSession.objects.create(
            user=self.user,
            is_active_session=True
        )
        self.assertTrue(session.is_active_session)
        self.assertEqual(session.user, self.user)
        self.assertIsNone(session.logout_time)

    def test_calculate_session_duration(self):
        """Test duration calculation."""
        now = timezone.now()
        session = WorkSession.objects.create(
            user=self.user,
            last_ping=now,
            is_active_session=True
        )
        # Bypass auto_now_add on login_time
        WorkSession.objects.filter(id=session.id).update(login_time=now - timedelta(hours=2))
        session.refresh_from_db()
        duration = session.calculate_duration()
        self.assertAlmostEqual(duration.total_seconds(), 7200, delta=10)

    def test_get_status_active(self):
        """Test status when recently active."""
        now = timezone.now()
        session = WorkSession.objects.create(
            user=self.user,
            last_desktop_ping=now,
            last_ping=now,
            is_active_session=True
        )
        self.assertEqual(session.get_status(), 'Active')

    def test_get_status_idle(self):
        """Test status when idle."""
        now = timezone.now()
        session = WorkSession.objects.create(
            user=self.user,
            last_desktop_ping=now - timedelta(minutes=3),
            last_ping=now - timedelta(minutes=3),
            is_active_session=True
        )
        self.assertEqual(session.get_status(), 'Idle')

        # Delete the previous active session to avoid unique constraint violation
        session.delete()

        # Test status when is_desktop_idle is explicitly True
        session2 = WorkSession.objects.create(
            user=self.user,
            last_desktop_ping=now,
            last_ping=now,
            is_desktop_idle=True,
            is_active_session=True
        )
        self.assertEqual(session2.get_status(), 'Idle')

    def test_get_status_offline(self):
        """Test status when offline."""
        now = timezone.now()
        session = WorkSession.objects.create(
            user=self.user,
            last_desktop_ping=now - timedelta(minutes=6),
            last_ping=now - timedelta(minutes=6),
            is_active_session=True
        )
        self.assertEqual(session.get_status(), 'Offline')

    def test_get_status_logged_out(self):
        """Test status when logged out."""
        now = timezone.now()
        session = WorkSession.objects.create(
            user=self.user,
            last_desktop_ping=now,
            last_ping=now,
            is_active_session=False
        )
        self.assertEqual(session.get_status(), 'Offline')

    def test_unique_active_session_constraint(self):
        """Test that only one active session per user is allowed."""
        WorkSession.objects.create(user=self.user, is_active_session=True)
        with self.assertRaises(Exception):
            WorkSession.objects.create(user=self.user, is_active_session=True)


class UtilityFunctionsTest(TestCase):
    """Test utility functions."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_get_or_create_user_profile(self):
        """Test creating or retrieving user profile."""
        profile = get_or_create_user_profile(self.user)
        self.assertEqual(profile.user, self.user)

        # Test retrieving existing
        profile2 = get_or_create_user_profile(self.user)
        self.assertEqual(profile.id, profile2.id)

    def test_is_tracking_enabled(self):
        """Test tracking status check."""
        # Initially disabled
        self.assertFalse(is_tracking_enabled(self.user))

        # Enable tracking
        profile = get_or_create_user_profile(self.user)
        profile.is_tracking_enabled = True
        profile.save()

        self.assertTrue(is_tracking_enabled(self.user))

    def test_get_or_create_active_session(self):
        """Test creating or retrieving active session."""
        session, created = get_or_create_active_session(self.user)
        self.assertTrue(created)
        self.assertTrue(session.is_active_session)

        # Test retrieving existing
        session2, created = get_or_create_active_session(self.user)
        self.assertFalse(created)
        self.assertEqual(session.id, session2.id)

    def test_update_session_ping(self):
        """Test updating session ping time."""
        session = WorkSession.objects.create(user=self.user)
        old_ping = session.last_ping

        # Small delay
        import time
        time.sleep(0.1)

        session = update_session_ping(session)
        self.assertGreater(session.last_ping, old_ping)

    def test_format_duration(self):
        """Test duration formatting."""
        duration = timedelta(hours=5, minutes=30, seconds=45)
        formatted = format_duration(duration)
        self.assertEqual(formatted, "05:30:45")

        # Test zero duration
        self.assertEqual(format_duration(timedelta(0)), "00:00:00")

    def test_calculate_daily_working_time(self):
        """Test daily work time calculation."""
        today = timezone.now().date()
        # Set now to noon to ensure now - 8 hours is still within today's date
        now = timezone.now().replace(hour=12, minute=0, second=0, microsecond=0)

        # Create multiple sessions
        session1 = WorkSession.objects.create(
            user=self.user,
            is_active_session=False
        )
        WorkSession.objects.filter(id=session1.id).update(
            login_time=now - timedelta(hours=8),
            logout_time=now - timedelta(hours=4)
        )

        session2 = WorkSession.objects.create(
            user=self.user,
            is_active_session=False
        )
        WorkSession.objects.filter(id=session2.id).update(
            login_time=now - timedelta(hours=3),
            logout_time=now - timedelta(hours=1)
        )

        total = calculate_daily_working_time(self.user, date=today)
        expected = timedelta(hours=6)
        self.assertAlmostEqual(total.total_seconds(), expected.total_seconds(), delta=10)

    def test_toggle_tracking(self):
        """Test toggling tracking status."""
        # Toggle on
        profile = toggle_tracking(self.user, enable=True)
        self.assertTrue(profile.is_tracking_enabled)

        # Toggle off
        profile = toggle_tracking(self.user, enable=False)
        self.assertFalse(profile.is_tracking_enabled)

        # Toggle without specifying
        profile = toggle_tracking(self.user)
        self.assertTrue(profile.is_tracking_enabled)

    def test_get_employee_status(self):
        """Test getting employee status."""
        profile = get_or_create_user_profile(self.user)
        profile.is_tracking_enabled = True
        profile.save()

        session = WorkSession.objects.create(
            user=self.user,
            last_desktop_ping=timezone.now(),
            is_active_session=True
        )

        status_data = get_employee_status(self.user)
        
        self.assertEqual(status_data['user_id'], self.user.id)
        self.assertEqual(status_data['username'], self.user.username)
        self.assertTrue(status_data['is_tracking_enabled'])
        self.assertEqual(status_data['status'], 'Active')

    def test_auto_logout_inactive_users(self):
        """Test auto logout functionality."""
        # Create inactive session
        now = timezone.now()
        session = WorkSession.objects.create(
            user=self.user,
            is_active_session=True
        )
        WorkSession.objects.filter(id=session.id).update(
            login_time=now - timedelta(minutes=20),
            last_desktop_ping=now - timedelta(minutes=20),
            last_ping=now - timedelta(minutes=20)
        )

        # Auto logout with 15 minute timeout
        count = auto_logout_inactive_users(timeout_minutes=15)

        # Check session is closed
        session.refresh_from_db()
        self.assertFalse(session.is_active_session)
        self.assertIsNotNone(session.logout_time)


class HeartbeatAPITest(APITestCase):
    """Test Heartbeat API endpoint."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        UserProfile.objects.filter(user=self.user).delete()
        self.profile = UserProfile.objects.create(
            user=self.user,
            is_tracking_enabled=True
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_heartbeat_creates_session(self):
        """Test that heartbeat creates a session."""
        response = self.client.post('/api/v1/tracking/heartbeat/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        session = WorkSession.objects.filter(user=self.user).first()
        self.assertIsNotNone(session)
        self.assertTrue(session.is_active_session)

    def test_heartbeat_updates_ping(self):
        """Test that heartbeat updates last_ping."""
        session = WorkSession.objects.create(user=self.user, is_active_session=True)
        old_ping = session.last_ping

        import time
        time.sleep(0.1)

        response = self.client.post('/api/v1/tracking/heartbeat/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        session.refresh_from_db()
        self.assertGreater(session.last_ping, old_ping)

    def test_heartbeat_tracking_disabled(self):
        """Test heartbeat fails when tracking disabled."""
        self.profile.is_tracking_enabled = False
        self.profile.save()

        response = self.client.post('/api/v1/tracking/heartbeat/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(response.data['success'])

    def test_heartbeat_activity_productive(self):
        """Test heartbeat with sufficient input activity updates productive time."""
        response = self.client.post('/api/v1/tracking/heartbeat/', {
            'app_name': 'VS Code',
            'window_title': 'main.py',
            'duration_seconds': 60,
            'mouse_moves': 10,
            'key_presses': 5,
            'clicks': 3
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        session = WorkSession.objects.get(user=self.user)
        self.assertEqual(session.mouse_moves, 10)
        self.assertEqual(session.key_presses, 5)
        self.assertEqual(session.clicks, 3)
        self.assertEqual(session.productive_seconds, 60)
        self.assertGreater(session.activity_percentage, 0.0)

    def test_heartbeat_activity_non_productive(self):
        """Test heartbeat with low/insufficient input activity registers 0 productive time."""
        response = self.client.post('/api/v1/tracking/heartbeat/', {
            'app_name': 'VS Code',
            'window_title': 'main.py',
            'duration_seconds': 60,
            'mouse_moves': 0,
            'key_presses': 0,
            'clicks': 0
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        session = WorkSession.objects.get(user=self.user)
        self.assertEqual(session.mouse_moves, 0)
        self.assertEqual(session.key_presses, 0)
        self.assertEqual(session.clicks, 0)
        self.assertEqual(session.productive_seconds, 0)

    def test_batch_sync_activity_processing(self):
        """Test batch sync processing activity counts and updating metrics."""
        response = self.client.post('/api/v1/tracking/activity-batch-sync/', {
            'activities': [
                {
                    'app_name': 'VS Code',
                    'window_title': 'main.py',
                    'duration_seconds': 60,
                    'mouse_moves': 10,
                    'key_presses': 5,
                    'clicks': 3,
                    'timestamp': '2026-05-20T12:00:00Z'
                },
                {
                    'app_name': 'Chrome',
                    'window_title': 'Google Search',
                    'duration_seconds': 60,
                    'mouse_moves': 0,
                    'key_presses': 0,
                    'clicks': 0,
                    'timestamp': '2026-05-20T12:00:10Z'
                }
            ]
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        session = WorkSession.objects.get(user=self.user)
        self.assertEqual(session.mouse_moves, 10)
        self.assertEqual(session.key_presses, 5)
        self.assertEqual(session.clicks, 3)
        self.assertEqual(session.productive_seconds, 60) # Chrome tick was not productive


class EmployeeStatusAPITest(APITestCase):
    """Test Employee Status endpoint."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        UserProfile.objects.filter(user=self.user).delete()
        self.profile = UserProfile.objects.create(
            user=self.user,
            is_tracking_enabled=True
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_get_all_employee_status(self):
        """Test getting all employee status."""
        response = self.client.get('/api/v1/tracking/employee-status/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_get_single_employee_status(self):
        """Test getting single employee status."""
        response = self.client.get(f'/api/v1/tracking/employee-status/{self.user.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user_id'], self.user.id)
        self.assertTrue(response.data['is_tracking_enabled'])


class ToggleTrackingAPITest(APITestCase):
    """Test Toggle Tracking endpoint."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        UserProfile.objects.filter(user=self.user).delete()
        self.profile = UserProfile.objects.create(
            user=self.user,
            is_tracking_enabled=False
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_toggle_tracking_on(self):
        """Test enabling tracking."""
        response = self.client.post(
            f'/api/v1/tracking/toggle-tracking/{self.user.id}/',
            {'enabled': True},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['data']['is_tracking_enabled'])

    def test_toggle_tracking_off(self):
        """Test disabling tracking."""
        response = self.client.post(
            f'/api/v1/tracking/toggle-tracking/{self.user.id}/',
            {'enabled': False},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['data']['is_tracking_enabled'])


# Run tests with: python manage.py test apps.tracking
# Or: pytest backend/apps/tracking/tests.py
