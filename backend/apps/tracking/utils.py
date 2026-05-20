from datetime import timedelta
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import UserProfile, WorkSession


def get_or_create_user_profile(user):
    """Get or create UserProfile for a user."""
    profile, created = UserProfile.objects.get_or_create(user=user)
    return profile


def is_tracking_enabled(user):
    """Check if tracking is enabled for user."""
    try:
        profile = UserProfile.objects.get(user=user)
        return profile.is_tracking_enabled
    except UserProfile.DoesNotExist:
        return False


def get_or_create_active_session(user):
    """Get existing active session or create new one.
       If the existing session has been inactive for > 5 mins, close it and create a new one."""
    try:
        session = WorkSession.objects.get(
            user=user,
            is_active_session=True
        )
        
        # Gap Detection: Check if last ping was more than 5 minutes ago
        time_since_ping = timezone.now() - session.last_ping
        if time_since_ping.total_seconds() > 300:  # 5 minutes
            # Close old session using last_ping so the offline gap isn't counted
            session.logout_time = session.last_ping
            session.is_active_session = False
            session.total_duration = session.calculate_duration()
            session.save(update_fields=['logout_time', 'is_active_session', 'total_duration', 'updated_at'])
            
            # Start new session
            new_session = WorkSession.objects.create(
                user=user,
                is_active_session=True
            )
            return new_session, True
            
        return session, False
    except WorkSession.DoesNotExist:
        session = WorkSession.objects.create(
            user=user,
            is_active_session=True
        )
        return session, True


def update_session_ping(session):
    """Update last_ping timestamp for a session."""
    session.last_ping = timezone.now()
    session.save(update_fields=['last_ping', 'updated_at'])
    return session


def close_session(session):
    """Close an active session."""
    session.logout_time = timezone.now()
    session.is_active_session = False
    session.total_duration = session.calculate_duration()
    session.save(update_fields=['logout_time', 'is_active_session', 'total_duration', 'updated_at'])
    return session


def get_session_status(session):
    """Get current status of a session."""
    return session.get_status()


def format_duration(duration):
    """Convert timedelta to HH:MM:SS format."""
    if not duration:
        return "00:00:00"
    
    total_seconds = int(duration.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


def calculate_daily_working_time(user, date=None):
    """
    Calculate total working time for a user on a specific date.
    
    Args:
        user: User instance
        date: Date object (defaults to today)
    
    Returns:
        timedelta: Total working time
    """
    if date is None:
        date = timezone.now().date()
    
    # Get all sessions for the user on the given date
    sessions = WorkSession.objects.filter(
        user=user,
        login_time__date=date
    )
    
    total_duration = timedelta(0)
    
    for session in sessions:
        duration = session.calculate_duration()
        # Ensure duration doesn't exceed 24 hours (sanity check)
        if duration.total_seconds() > 86400:
            continue
        total_duration += duration
    
    return total_duration


def get_employee_status(user):
    """
    Get comprehensive status info for an employee.
    
    Returns:
        dict with user status, tracking status, work time, etc.
    """
    try:
        profile = UserProfile.objects.select_related('user').get(user=user)
    except UserProfile.DoesNotExist:
        profile = get_or_create_user_profile(user)
    
    try:
        session = WorkSession.objects.filter(user=user).latest('login_time')
    except WorkSession.DoesNotExist:
        session = None
        
    # Get first login time of today
    today = timezone.now().date()
    try:
        first_session = WorkSession.objects.filter(user=user, login_time__date=today).earliest('login_time')
        first_login_time = first_session.login_time
    except WorkSession.DoesNotExist:
        first_login_time = None
    
    if session:
        status = session.get_status()
        login_time = session.login_time
        last_ping = session.last_ping
    else:
        status = 'Offline'
        login_time = None
        last_ping = None
    
    # Calculate daily working time
    daily_working_time = calculate_daily_working_time(user)
    formatted_time = format_duration(daily_working_time)
    
    # Calculate full_name using user.name or first_name + last_name
    full_name = getattr(user, 'name', '').strip()
    if not full_name:
        full_name = f"{user.first_name} {user.last_name}".strip()
    
    # Calculate employee_code
    employee_code = f"GS-26-{str(user.id).zfill(3)}"
    
    return {
        'user_id': user.id,
        'username': user.username,
        'first_name': user.first_name or '',
        'last_name': user.last_name or '',
        'full_name': full_name,
        'email': user.email,
        'employee_code': employee_code,
        'is_tracking_enabled': profile.is_tracking_enabled,
        'screenshots_enabled': profile.screenshots_enabled,
        'status': status,
        'login_time': login_time,
        'first_login_time': first_login_time,
        'last_ping': last_ping,
        'total_work_time': formatted_time,
        'session_id': session.id if session else None,
    }


def get_all_employees_status(include_inactive=False):
    """
    Get status for all employees.
    
    Args:
        include_inactive: Whether to include inactive users
    
    Returns:
        list of dicts with employee status
    """
    User = get_user_model()
    
    if not include_inactive:
        users = User.objects.filter(is_active=True)
    else:
        users = User.objects.all()
        
    employees_status = []
    for user in users:
        employees_status.append(get_employee_status(user))
    
    return employees_status


def toggle_tracking(user, enable=None):
    """
    Toggle tracking for a user.
    
    Args:
        user: User instance
        enable: True/False to set state, None to toggle
    
    Returns:
        Updated UserProfile
    """
    profile = get_or_create_user_profile(user)
    
    if enable is None:
        profile.is_tracking_enabled = not profile.is_tracking_enabled
    else:
        profile.is_tracking_enabled = enable
    
    profile.save(update_fields=['is_tracking_enabled', 'updated_at'])
    return profile


def auto_logout_inactive_users(timeout_minutes=15):
    """
    Auto logout users who haven't sent any ping (browser or desktop) in timeout_minutes.
    
    Args:
        timeout_minutes: Time in minutes before marking as offline
    
    Returns:
        Number of sessions closed
    """
    timeout = timezone.now() - timedelta(minutes=timeout_minutes)
    
    # Find active sessions where:
    # 1. last_ping is older than timeout OR
    # 2. last_ping is null and login_time is older than timeout
    inactive_sessions = WorkSession.objects.filter(
        is_active_session=True
    ).filter(
        Q(last_ping__lt=timeout) | 
        Q(last_ping__isnull=True, login_time__lt=timeout)
    )
    
    count = 0
    for session in inactive_sessions:
        # Use the most recent activity time (either last_desktop_ping or last_ping or login_time)
        logout_time = session.last_desktop_ping or session.last_ping or session.login_time or timezone.now()
        session.logout_time = logout_time
        session.is_active_session = False
        session.total_duration = session.calculate_duration()
        session.save(update_fields=['logout_time', 'is_active_session', 'total_duration', 'updated_at'])
        count += 1
    
    return count


def cleanup_old_sessions(days=90):
    """
    Delete old closed sessions to maintain DB performance.
    
    Args:
        days: Delete sessions older than this many days
    
    Returns:
        Number of sessions deleted
    """
    cutoff_date = timezone.now() - timedelta(days=days)
    
    deleted_count, _ = WorkSession.objects.filter(
        is_active_session=False,
        logout_time__lt=cutoff_date
    ).delete()
    
    return deleted_count
