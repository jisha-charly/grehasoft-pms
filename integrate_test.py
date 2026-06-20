"""
COMPREHENSIVE INTEGRATION TESTING SCRIPT

Run this to verify the tracking system is working correctly.
Usage: python integrate_test.py
"""

import os
import sys
import json
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()
from rest_framework.test import APIClient

# pyrefly: ignore [missing-import]
from apps.tracking.models import UserProfile, WorkSession
# pyrefly: ignore [missing-import]
from apps.tracking.utils import get_or_create_user_profile

class TrackingSystemIntegrationTest:
    """Integration test suite for tracking system."""

    def __init__(self):
        self.client = APIClient()
        self.test_user = None
        self.token = None
        self.results = []

    def setUp(self):
        """Set up test user."""
        print('\n' + '='*60)
        print('WORK TRACKING SYSTEM - INTEGRATION TEST')
        print('='*60)
        
        # Create test user
        self.test_user, created = User.objects.get_or_create(
            username='tracking_test_user',
            defaults={
                'email': 'test.tracking@example.com',
                'first_name': 'Test',
                'last_name': 'Tracking',
            }
        )
        
        # Ensure profile exists
        get_or_create_user_profile(self.test_user)
        
        # Force authentication on client
        self.client.force_authenticate(user=self.test_user)
        
        print(f'\n✓ Test user ready: {self.test_user.username}')

    def test_user_profile(self):
        """Test 1: UserProfile Creation."""
        print('\nTest 1: UserProfile Creation...')
        
        try:
            profile = UserProfile.objects.get(user=self.test_user)
            profile.is_tracking_enabled = False
            profile.save()
            assert profile is not None
            assert profile.user == self.test_user
            assert profile.is_tracking_enabled == False  # Default
            
            print('  ✓ Profile exists with correct default state')
            self.results.append(('UserProfile Creation', 'PASS'))
        except Exception as e:
            print(f'  ✗ Failed: {str(e)}')
            self.results.append(('UserProfile Creation', 'FAIL'))

    def test_heartbeat_api(self):
        """Test 2: Heartbeat API."""
        print('\nTest 2: Heartbeat API...')
        
        try:
            # Enable tracking first
            profile = UserProfile.objects.get(user=self.test_user)
            profile.is_tracking_enabled = True
            profile.save()
            
            # Send heartbeat
            response = self.client.post('/api/v1/tracking/heartbeat/')
            
            assert response.status_code == 200
            assert response.data['success'] == True
            
            # Verify session created
            session = WorkSession.objects.filter(
                user=self.test_user,
                is_active_session=True
            ).first()
            assert session is not None
            
            print('  ✓ Heartbeat recorded, session created')
            self.results.append(('Heartbeat API', 'PASS'))
        except Exception as e:
            print(f'  ✗ Failed: {str(e)}')
            self.results.append(('Heartbeat API', 'FAIL'))

    def test_user_status_api(self):
        """Test 3: User Status API."""
        print('\nTest 3: User Status API...')
        
        try:
            response = self.client.get('/api/v1/tracking/user-status/')
            
            assert response.status_code == 200
            assert response.data['user_id'] == self.test_user.id
            assert response.data['is_tracking_enabled'] == True
            
            print(f'  ✓ Status retrieved successfully')
            self.results.append(('User Status API', 'PASS'))
        except Exception as e:
            print(f'  ✗ Failed: {str(e)}')
            self.results.append(('User Status API', 'FAIL'))

    def test_employee_status_api(self):
        """Test 4: Employee Status API."""
        print('\nTest 4: Employee Status API...')
        
        try:
            response = self.client.get('/api/v1/tracking/employee-status/')
            
            assert response.status_code == 200
            assert isinstance(response.data, list)
            
            # Find our test user
            test_emp = None
            for emp in response.data:
                if emp['user_id'] == self.test_user.id:
                    test_emp = emp
                    break
            
            assert test_emp is not None
            assert test_emp['status'] in ['Active', 'Idle', 'Offline']
            assert 'total_work_time' in test_emp
            
            print(f'  ✓ Employee status retrieved: {test_emp["status"]}')
            self.results.append(('Employee Status API', 'PASS'))
        except Exception as e:
            print(f'  ✗ Failed: {str(e)}')
            self.results.append(('Employee Status API', 'FAIL'))

    def test_toggle_tracking(self):
        """Test 5: Toggle Tracking."""
        print('\nTest 5: Toggle Tracking...')
        
        try:
            # Toggle off
            response = self.client.post(
                f'/api/v1/tracking/toggle-tracking/{self.test_user.id}/',
                {'enabled': False},
                format='json'
            )
            
            assert response.status_code == 200
            assert response.data['data']['is_tracking_enabled'] == False
            
            # Toggle on
            response = self.client.post(
                f'/api/v1/tracking/toggle-tracking/{self.test_user.id}/',
                {'enabled': True},
                format='json'
            )
            
            assert response.status_code == 200
            assert response.data['data']['is_tracking_enabled'] == True
            
            print('  ✓ Tracking toggled successfully')
            self.results.append(('Toggle Tracking', 'PASS'))
        except Exception as e:
            print(f'  ✗ Failed: {str(e)}')
            self.results.append(('Toggle Tracking', 'FAIL'))

    def test_logout_api(self):
        """Test 6: Logout API."""
        print('\nTest 6: Logout API...')
        
        try:
            response = self.client.post('/api/v1/tracking/logout/')
            
            assert response.status_code == 200
            assert response.data['success'] == True
            
            # Verify session closed
            session = WorkSession.objects.get(id=response.data['session_id'])
            assert session.is_active_session == False
            assert session.logout_time is not None
            
            print('  ✓ Session closed successfully')
            self.results.append(('Logout API', 'PASS'))
        except Exception as e:
            print(f'  ✗ Failed: {str(e)}')
            self.results.append(('Logout API', 'FAIL'))

    def test_work_sessions_api(self):
        """Test 7: Work Sessions API."""
        print('\nTest 7: Work Sessions API...')
        
        try:
            response = self.client.get('/api/v1/tracking/sessions/')
            
            assert response.status_code == 200
            results = response.data.get('results') if isinstance(response.data, dict) else response.data
            assert isinstance(results, list)
            
            print(f'  ✓ Sessions retrieved: {len(results)} total')
            self.results.append(('Work Sessions API', 'PASS'))
        except Exception as e:
            print(f'  ✗ Failed: {str(e)}')
            self.results.append(('Work Sessions API', 'FAIL'))

    def print_results(self):
        """Print test results."""
        print('\n' + '='*60)
        print('TEST RESULTS')
        print('='*60)
        
        passed = 0
        failed = 0
        
        for test_name, result in self.results:
            status = '✓' if result == 'PASS' else '✗'
            color = '\033[92m' if result == 'PASS' else '\033[91m'
            reset = '\033[0m'
            print(f'{status} {test_name}: {color}{result}{reset}')
            
            if result == 'PASS':
                passed += 1
            else:
                failed += 1
        
        print('\n' + '-'*60)
        print(f'Total: {passed} Passed, {failed} Failed out of {passed+failed}')
        print('='*60 + '\n')
        
        return failed == 0

    def run(self):
        """Run all tests."""
        self.setUp()
        
        self.test_user_profile()
        self.test_heartbeat_api()
        self.test_user_status_api()
        self.test_employee_status_api()
        self.test_toggle_tracking()
        self.test_logout_api()
        self.test_work_sessions_api()
        
        success = self.print_results()
        
        return 0 if success else 1


if __name__ == '__main__':
    tester = TrackingSystemIntegrationTest()
    exit_code = tester.run()
    sys.exit(exit_code)
