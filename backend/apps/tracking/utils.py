from datetime import timedelta
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import UserProfile, WorkSession, AppActivity


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


def get_or_create_active_session(user, device_id='default'):
    """Get existing active session or create new one.
       If the existing session has been inactive for > 5 mins, close it and create a new one."""
    now = timezone.now()
    
    # 1. Handle browser ping request (device_id == 'default')
    if device_id == 'default':
        # Check if there is an active desktop session first
        active_desktop_session = WorkSession.objects.filter(
            user=user,
            is_active_session=True
        ).exclude(device_id='default').first()
        
        if active_desktop_session:
            # If the desktop session has been inactive for > 5 mins, we close it and fallback to browser
            time_since_desktop_ping = now - active_desktop_session.last_ping
            if time_since_desktop_ping.total_seconds() > 300:
                active_desktop_session.logout_time = active_desktop_session.last_ping
                active_desktop_session.is_active_session = False
                active_desktop_session.total_duration = active_desktop_session.calculate_duration()
                active_desktop_session.save(update_fields=['logout_time', 'is_active_session', 'total_duration', 'updated_at'])
                # Proceed to get/create browser session below
            else:
                # Desktop is active, so route browser ping to this active desktop session
                return active_desktop_session, False
                
    # 2. Handle desktop ping request (device_id != 'default')
    else:
        # If there is any active session with a DIFFERENT device_id, close it
        other_active_sessions = WorkSession.objects.filter(
            user=user,
            is_active_session=True
        ).exclude(device_id=device_id)
        
        for old_sess in other_active_sessions:
            old_sess.logout_time = old_sess.last_ping or old_sess.login_time or now
            old_sess.is_active_session = False
            old_sess.total_duration = old_sess.calculate_duration()
            old_sess.save(update_fields=['logout_time', 'is_active_session', 'total_duration', 'updated_at'])
            
    # 3. Standard get/create for the requested device_id
    try:
        session = WorkSession.objects.get(
            user=user,
            device_id=device_id,
            is_active_session=True
        )
        
        # Gap Detection: Check if last ping was more than 5 minutes ago
        time_since_ping = now - session.last_ping
        if time_since_ping.total_seconds() > 300:  # 5 minutes
            # Close old session using last_ping so the offline gap isn't counted
            session.logout_time = session.last_ping
            session.is_active_session = False
            session.total_duration = session.calculate_duration()
            session.save(update_fields=['logout_time', 'is_active_session', 'total_duration', 'updated_at'])
            
            # Start new session
            new_session = WorkSession.objects.create(
                user=user,
                device_id=device_id,
                is_active_session=True
            )
            return new_session, True
            
        return session, False
    except WorkSession.DoesNotExist:
        session = WorkSession.objects.create(
            user=user,
            device_id=device_id,
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


def calculate_daily_metrics(user, date=None):
    """
    Calculate daily tracking metrics for a user.
    """
    if date is None:
        date = timezone.now().date()
        
    sessions = list(WorkSession.objects.filter(
        user=user,
        login_time__date=date
    ).order_by('login_time'))
    
    if not sessions:
        return {
            'total_tracked_time': timezone.timedelta(0),
            'productive_time': timezone.timedelta(0),
            'non_productive_time': timezone.timedelta(0),
            'portal_active_time': timezone.timedelta(0),
            'break_time': timezone.timedelta(0),
            'unaccounted_time': timezone.timedelta(0),
            'desktop_work_time': timezone.timedelta(0),
            'total_engagement_time': timezone.timedelta(0),
            'activity_percentage': 0.0
        }
        
    first_login = min(s.login_time for s in sessions)
    last_active = max(s.logout_time or s.last_ping or s.login_time for s in sessions)
    spanned_duration = max(0, int((last_active - first_login).total_seconds()))
    
    productive_sec = 0
    idle_sec = 0
    portal_active_sec = 0
    
    for s in sessions:
        s_end = s.logout_time or s.last_ping or timezone.now()
        s_elapsed = max(0, int((s_end - s.login_time).total_seconds()))
        if s.device_id == 'default':
            portal_active_sec += s_elapsed
        else:
            s_prod = max(0, s.productive_seconds)
            s_idle = max(0, s.idle_seconds)
            if s_prod + s_idle > s_elapsed:
                if s_prod > s_elapsed:
                    s_prod = s_elapsed
                    s_idle = 0
                else:
                    s_idle = s_elapsed - s_prod
            productive_sec += s_prod
            idle_sec += s_idle
            
    activities = list(AppActivity.objects.filter(
        user=user,
        timestamp__date=date
    ).order_by('timestamp'))
    
    from .reports import detect_breaks_and_gaps
    break_analysis = detect_breaks_and_gaps(user, date, date, sessions_list=sessions, activities_list=activities)
    
    offline_break_sec = sum(b['duration'] for b in break_analysis['breaks_list'] if b['type'] == 'offline')
    idle_break_sec = sum(b['duration'] for b in break_analysis['breaks_list'] if b['type'] == 'idle')
    
    reconciled_idle_sec = max(0, idle_sec - idle_break_sec)
    reconciled_break_sec = offline_break_sec + idle_break_sec
    
    desktop_work_sec = productive_sec + reconciled_idle_sec
    total_engagement_sec = desktop_work_sec + portal_active_sec
    
    sum_accounted = productive_sec + reconciled_idle_sec + portal_active_sec + reconciled_break_sec
    unaccounted_sec = max(0, spanned_duration - sum_accounted)
    
    activity_percentage = (productive_sec / desktop_work_sec * 100) if desktop_work_sec > 0 else 0.0
    
    return {
        'total_tracked_time': timezone.timedelta(seconds=desktop_work_sec),
        'productive_time': timezone.timedelta(seconds=productive_sec),
        'non_productive_time': timezone.timedelta(seconds=reconciled_idle_sec),
        'portal_active_time': timezone.timedelta(seconds=portal_active_sec),
        'break_time': timezone.timedelta(seconds=reconciled_break_sec),
        'unaccounted_time': timezone.timedelta(seconds=unaccounted_sec),
        'desktop_work_time': timezone.timedelta(seconds=desktop_work_sec),
        'total_engagement_time': timezone.timedelta(seconds=total_engagement_sec),
        'activity_percentage': activity_percentage
    }


def calculate_daily_working_time(user, date=None):
    """
    Calculate total working time for a user on a specific date.
    
    Args:
        user: User instance
        date: Date object (defaults to today)
    
    Returns:
        timedelta: Total working time
    """
    metrics = calculate_daily_metrics(user, date)
    return metrics['productive_time']


def get_employee_status(user, detailed=False):
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
        from django.db import models
        session = WorkSession.objects.filter(user=user, is_active_session=True).annotate(
            last_activity=models.F('last_ping')
        ).order_by('-last_activity').first()
        
        if not session:
            session = WorkSession.objects.filter(user=user).annotate(
                last_activity=models.F('last_ping')
            ).order_by('-last_activity').first()
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
    
    # Calculate daily metrics
    metrics = calculate_daily_metrics(user)
    
    # Calculate full_name using user.name or first_name + last_name
    full_name = getattr(user, 'name', '').strip()
    if not full_name:
        full_name = f"{user.first_name} {user.last_name}".strip()
    
    # Calculate employee_code
    employee_code = f"GS-26-{str(user.id).zfill(3)}"
    
    # Fetch current active app/window
    current_app = None
    current_window = None
    
    if session:
        latest_act = AppActivity.objects.filter(session=session).order_by('-timestamp').first()
        if latest_act:
            current_app = latest_act.app_name
            current_window = latest_act.window_title
    
    result = {
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
        'total_work_time': format_duration(metrics['productive_time']),
        'idle_time': format_duration(metrics['non_productive_time']),
        'activity_percentage': round(metrics['activity_percentage'], 2),
        'productive_time': format_duration(metrics['productive_time']),
        'non_productive_time': format_duration(metrics['non_productive_time']),
        'total_tracked_time': format_duration(metrics['total_tracked_time']),
        'desktop_work_time': format_duration(metrics['desktop_work_time']),
        'portal_active_time': format_duration(metrics['portal_active_time']),
        'break_time': format_duration(metrics['break_time']),
        'unaccounted_time': format_duration(metrics['unaccounted_time']),
        'total_engagement_time': format_duration(metrics['total_engagement_time']),
        'session_id': session.id if session else None,
        'session_type': session.session_type if session else None,
        'current_app': current_app,
        'current_window': current_window,
        'mouse_moves': session.mouse_moves if session else 0,
        'key_presses': session.key_presses if session else 0,
        'clicks': session.clicks if session else 0,
        'productive_seconds': session.productive_seconds if session else 0,
        'idle_seconds': session.idle_seconds if session else 0,
    }
    
    if detailed:
        # Fetch up to 50 recent activities for today
        recent_activities = []
        if session:
            acts = AppActivity.objects.filter(session=session).order_by('-timestamp')[:50]
            recent_activities = list(acts)
            

            
        # Compute hourly timeline data
        hourly_timeline = []
        from .reports import classify_app_activity
        for h in range(24):
            hour_12 = f"{h if h % 12 != 0 else 12:02d}:00 {'AM' if h < 12 else 'PM'}"
            hourly_timeline.append({
                'hour': hour_12,
                'productive': 0.0,
                'idle': 0.0,
            })
            
        if session:
            day_activities = AppActivity.objects.filter(user=user, timestamp__date=timezone.now().date())
            for act in day_activities:
                act_hour = act.timestamp.astimezone(timezone.get_current_timezone()).hour
                category = classify_app_activity(act.app_name, act.window_title)
                duration = act.duration_seconds
                
                if category == 'productive':
                    hourly_timeline[act_hour]['productive'] += duration
                elif category == 'non_productive':
                    hourly_timeline[act_hour]['idle'] += duration
                else:
                    hourly_timeline[act_hour]['productive'] += duration
                    
        # Convert seconds to minutes for clean chart rendering
        for entry in hourly_timeline:
            entry['productive'] = round(entry['productive'] / 60, 2)
            entry['idle'] = round(entry['idle'] / 60, 2)
            
        result['app_activities'] = recent_activities
        result['timeline_data'] = hourly_timeline
        
    return result


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
        employees_status.append(get_employee_status(user, detailed=False))
    
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
