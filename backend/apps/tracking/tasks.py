from celery import shared_task
from django.utils import timezone
from .utils import auto_logout_inactive_users, cleanup_old_sessions
import logging

logger = logging.getLogger(__name__)


@shared_task
def auto_logout_inactive():
    """
    Celery task: Auto logout users inactive for 15 minutes.
    
    Schedule: Run every 5 minutes for near real-time logout
    """
    try:
        timeout_minutes = 15
        count = auto_logout_inactive_users(timeout_minutes=timeout_minutes)
        logger.info(f"Auto-logged out {count} inactive users")
        return {'status': 'success', 'logged_out': count}
    except Exception as e:
        logger.error(f"Error in auto_logout_inactive: {str(e)}")
        return {'status': 'error', 'message': str(e)}


@shared_task
def cleanup_old_data():
    """
    Celery task: Clean up old session data.
    
    Schedule: Run daily to maintain DB performance
    """
    try:
        # Delete sessions older than 90 days
        count = cleanup_old_sessions(days=90)
        logger.info(f"Deleted {count} old work sessions")
        return {'status': 'success', 'deleted': count}
    except Exception as e:
        logger.error(f"Error in cleanup_old_data: {str(e)}")
        return {'status': 'error', 'message': str(e)}


@shared_task
def generate_daily_report():
    """
    Celery task: Generate daily work time report.
    
    Schedule: Run at end of day (e.g., 11:59 PM)
    """
    try:
        from django.contrib.auth.models import User
        from .utils import calculate_daily_working_time, get_employee_status
        
        today = timezone.now().date()
        users = User.objects.filter(is_active=True)
        
        report_data = []
        for user in users:
            status_data = get_employee_status(user)
            report_data.append({
                'user_id': user.id,
                'username': user.username,
                'date': today.isoformat(),
                'total_work_time': status_data['total_work_time'],
            })
        
        logger.info(f"Daily report generated for {len(report_data)} users")
        return {'status': 'success', 'users_reported': len(report_data), 'data': report_data}
    except Exception as e:
        logger.error(f"Error in generate_daily_report: {str(e)}")
        return {'status': 'error', 'message': str(e)}
