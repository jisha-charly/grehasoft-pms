import datetime
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.contrib.auth import get_user_model
from .models import WorkSession, AppActivity

User = get_user_model()

def classify_app_activity(app_name, window_title=""):
    """
    Classify an application activity into:
    - 'productive': Coding tools, office tools, team communication.
    - 'non_productive': Social media, streaming, games, or idle.
    """
    app_name_lower = app_name.lower().strip()
    window_title_lower = window_title.lower() if window_title else ""
    
    # Handle explicit idle app names
    if not app_name_lower or app_name_lower == 'idle' or app_name_lower == 'none':
        return 'non_productive'
    
    # Non-productive keywords / apps
    non_productive_apps = [
        'youtube', 'facebook', 'twitter', 'instagram', 'netflix', 'spotify', 
        'reddit', 'pinterest', 'tumblr', 'tiktok', 'vimeo', 'solitaire', 
        'freecell', 'minesweeper', 'steam', 'epic games', 'origin', 'uplay',
        'discord', 'twitch', 'hulu', 'disney+', 'games', 'game'
    ]
    
    for np_app in non_productive_apps:
        if np_app in app_name_lower:
            return 'non_productive'
            
    # Check browser titles for non-productive web pages
    if any(b in app_name_lower for b in ['chrome', 'firefox', 'safari', 'edge', 'opera', 'browser']):
        non_productive_sites = ['youtube.com', 'facebook.com', 'twitter.com', 'instagram.com', 'netflix.com', 'reddit.com', 'pinterest.com', 'amazon.in', 'amazon.com', 'flipkart.com', 'ebay.com']
        for site in non_productive_sites:
            if site in window_title_lower or site.split('.')[0] in window_title_lower:
                return 'non_productive'
        # Browsers default to productive/neutral for work
        return 'productive'
        
    # Productive apps
    productive_apps = [
        'code', 'vs code', 'vscode', 'visual studio', 'cursor', 'pycharm', 'intellij', 
        'webstorm', 'eclipse', 'sublime', 'notepad++', 'git', 'github', 
        'gitlab', 'docker', 'postman', 'dbeaver', 'pgadmin', 'mysql', 
        'terminal', 'cmd', 'powershell', 'bash', 'zsh', 'putty', 'slack', 
        'teams', 'zoom', 'skype', 'word', 'excel', 'powerpoint', 'outlook', 
        'trello', 'jira', 'figma', 'photoshop', 'illustrator', 'grehasoft',
        'localhost', 'django', 'react', 'python', 'npm', 'node'
    ]
    
    for p_app in productive_apps:
        if p_app in app_name_lower:
            return 'productive'
            
    return 'productive'  # Default to productive unless explicitly classified otherwise


def get_session_duration(session, now=None):
    """Calculate session duration handling active sessions."""
    if not now:
        now = timezone.now()
    if session.logout_time:
        duration = session.logout_time - session.login_time
    else:
        duration = now - session.login_time
    return max(duration, timedelta(0))


def detect_breaks_and_gaps(user, start_date, end_date, sessions_list=None, activities_list=None):
    """
    Detect user breaks in a date range:
    1. Offline Breaks: gaps between consecutive work sessions on the same day.
    2. Idle Breaks: gaps between AppActivity records within a session (> 3 minutes).
    """
    if sessions_list is None:
        sessions_list = list(WorkSession.objects.filter(
            user=user,
            login_time__date__range=(start_date, end_date)
        ).order_by('login_time'))
        
    if activities_list is None:
        activities_list = list(AppActivity.objects.filter(
            user=user,
            timestamp__date__range=(start_date, end_date)
        ).order_by('timestamp'))

    breaks = []
    
    # 1. Offline Gaps
    for i in range(len(sessions_list) - 1):
        s1 = sessions_list[i]
        s2 = sessions_list[i+1]
        
        # Check if same day and there is a gap
        if s1.login_time.date() == s2.login_time.date():
            logout = s1.logout_time or s1.last_ping
            login = s2.login_time
            if logout and login > logout:
                gap = (login - logout).total_seconds()
                if gap >= 60:  # > 1 minute
                    breaks.append({
                        'start': logout,
                        'end': login,
                        'duration': gap,
                        'type': 'offline',
                        'description': 'Away from keyboard / Offline'
                    })
                    
    # 2. In-Session Activity Gaps
    for session in sessions_list:
        session_activities = [act for act in activities_list if act.session_id == session.id]
        if len(session_activities) < 2:
            continue
            
        for j in range(len(session_activities) - 1):
            act1 = session_activities[j]
            act2 = session_activities[j+1]
            
            act1_end = act1.timestamp + timedelta(seconds=act1.duration_seconds)
            act2_start = act2.timestamp
            
            if act2_start > act1_end:
                gap = (act2_start - act1_end).total_seconds()
                if gap >= 180:  # > 3 minutes idle
                    breaks.append({
                        'start': act1_end,
                        'end': act2_start,
                        'duration': gap,
                        'type': 'idle',
                        'description': 'Idle session'
                    })

    # Sort breaks by start time
    breaks = sorted(breaks, key=lambda x: x['start'])
    
    total_break_duration = sum(b['duration'] for b in breaks)
    return {
        'breaks_list': breaks,
        'break_count': len(breaks),
        'total_break_seconds': total_break_duration
    }


def format_seconds(seconds):
    """Format seconds into HH:MM:SS format."""
    seconds = int(seconds)
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def get_daily_report_data(start_date, end_date, department_id=None, search_query=None):
    """
    Get optimized daily reports for employees.
    Supports bulk fetching to handle 100+ employees efficiently.
    """
    # 1. Fetch Users
    users_query = User.objects.filter(is_active=True)
    if department_id:
        users_query = users_query.filter(department_id=department_id)
    if search_query:
        users_query = users_query.filter(
            Q(name__icontains=search_query) | 
            Q(username__icontains=search_query) | 
            Q(email__icontains=search_query)
        )
    users = list(users_query.select_related('role', 'department'))
    user_ids = [u.id for u in users]
    
    # 2. Bulk Fetch Tracking Data
    sessions = list(WorkSession.objects.filter(
        user_id__in=user_ids,
        login_time__date__range=(start_date, end_date)
    ).order_by('login_time'))
    
    activities = list(AppActivity.objects.filter(
        user_id__in=user_ids,
        timestamp__date__range=(start_date, end_date)
    ).order_by('timestamp'))
    
    # Group data by user and date
    user_data = {}
    for user in users:
        user_data[user.id] = {
            'user': user,
            'sessions': [],
            'activities': []
        }
        
    for s in sessions:
        if s.user_id in user_data:
            user_data[s.user_id]['sessions'].append(s)
            
    for a in activities:
        if a.user_id in user_data:
            user_data[a.user_id]['activities'].append(a)

    # 3. Process report rows
    report_rows = []
    current_time = timezone.now()
    
    # Generate list of dates in range
    date_list = []
    temp_date = start_date
    while temp_date <= end_date:
        date_list.append(temp_date)
        temp_date += timedelta(days=1)
        
    for user_id, data in user_data.items():
        user = data['user']
        full_name = user.name or f"{user.first_name} {user.last_name}".strip() or user.username
        emp_code = f"GS-26-{str(user.id).zfill(3)}"
        
        for d in date_list:
            day_sessions = [s for s in data['sessions'] if s.login_time.date() == d]
            day_activities = [a for a in data['activities'] if a.timestamp.date() == d]
            
            if not day_sessions:
                # No activity for this user on this day
                continue
                
            # Calculative parameters
            first_login = min(s.login_time for s in day_sessions)
            last_active = max(s.logout_time or s.last_ping or s.login_time for s in day_sessions)
            
            # Total tracked, productive, and idle seconds from WorkSession records, capped to elapsed duration
            productive_sec = 0
            idle_sec = 0
            portal_active_sec = 0
            for s in day_sessions:
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
            
            # Breaks detection
            break_analysis = detect_breaks_and_gaps(user, d, d, sessions_list=day_sessions, activities_list=day_activities)
            break_count = break_analysis['break_count']
            
            offline_break_sec = sum(b['duration'] for b in break_analysis['breaks_list'] if b['type'] == 'offline')
            idle_break_sec = sum(b['duration'] for b in break_analysis['breaks_list'] if b['type'] == 'idle')
            
            reconciled_idle_sec = idle_sec
            reconciled_break_sec = offline_break_sec + idle_break_sec
            
            spanned_duration = int((last_active - first_login).total_seconds())
            spanned_duration = max(0, spanned_duration)
            
            desktop_work_sec = productive_sec + reconciled_idle_sec
            total_engagement_sec = desktop_work_sec + portal_active_sec
            
            sum_accounted = productive_sec + reconciled_idle_sec + portal_active_sec + reconciled_break_sec
            unaccounted_sec = max(0, spanned_duration - sum_accounted)
            
            # Activity Percentage
            activity_pct = (productive_sec / desktop_work_sec * 100) if desktop_work_sec > 0 else 0.0
            print(f"Daily Report Aggregation - User: {user.username}, Date: {d.isoformat()} - calculated productive seconds: {productive_sec}, calculated idle seconds: {reconciled_idle_sec}, final report activity_percentage: {activity_pct}")
            
            # Latest session status
            latest_session = day_sessions[-1]
            tracking_status = latest_session.get_status() if d == timezone.now().date() else 'Offline'
            
            # Save calculations back to db WorkSessions if it's past day or session closed
            for s in day_sessions:
                if not s.is_active_session:
                    if s.device_id == 'default':
                        s.productive_seconds = 0
                        s.idle_seconds = 0
                        s.tracked_seconds = 0
                        s.break_count = 0
                        s.activity_percentage = 0.0
                        s.save(update_fields=['productive_seconds', 'idle_seconds', 'tracked_seconds', 'break_count', 'activity_percentage'])
                    else:
                        if s.idle_seconds == 0 or s.break_count == 0:
                            session_breaks = detect_breaks_and_gaps(user, d, d, sessions_list=[s], activities_list=day_activities)
                            duration_sec = max(0, int(get_session_duration(s, current_time).total_seconds()))
                            
                            s.idle_seconds = max(0, duration_sec - s.productive_seconds)
                            s.tracked_seconds = s.productive_seconds + s.idle_seconds
                            s.break_count = session_breaks['break_count']
                            if s.tracked_seconds > 0:
                                s.activity_percentage = min(100.0, (s.productive_seconds / s.tracked_seconds) * 100.0)
                            else:
                                s.activity_percentage = 0.0
                            s.save(update_fields=['productive_seconds', 'idle_seconds', 'tracked_seconds', 'break_count', 'activity_percentage'])

            report_rows.append({
                # Ordered fields requested by USER
                'employee_name': full_name,
                'employee_code': emp_code,
                'department': user.department.name if user.department else 'General',
                'date': d.isoformat(),
                'productive_time': format_seconds(productive_sec),
                'idle_time': format_seconds(reconciled_idle_sec),
                'desktop_work_time': format_seconds(desktop_work_sec),
                'portal_active_time': format_seconds(portal_active_sec),
                'break_time': format_seconds(reconciled_break_sec),
                'unaccounted_time': format_seconds(unaccounted_sec),
                'total_engagement_time': format_seconds(total_engagement_sec),
                'workday_span': format_seconds(spanned_duration),
                'activity_percentage': round(min(100.0, activity_pct), 2),
                'status': tracking_status,
                
                # Original fields for backward compatibility
                'user_id': user.id,
                'username': user.username,
                'full_name': full_name,
                'email': user.email,
                'first_login': first_login.isoformat() if first_login else None,
                'last_active': last_active.isoformat() if last_active else None,
                'total_tracked_time': format_seconds(desktop_work_sec),
                'break_count': break_count,
                
                # Raw fields
                'raw_tracked_seconds': desktop_work_sec,
                'raw_productive_seconds': productive_sec,
                'raw_idle_seconds': reconciled_idle_sec,
                'raw_desktop_work_seconds': desktop_work_sec,
                'raw_portal_active_seconds': portal_active_sec,
                'raw_break_seconds': reconciled_break_sec,
                'raw_unaccounted_seconds': unaccounted_sec,
                'raw_total_engagement_seconds': total_engagement_sec,
                'raw_workday_span': spanned_duration,
            })
            
    return report_rows


def get_weekly_report_data(start_date, end_date, department_id=None):
    """
    Generate weekly analytical summaries and productivity trends.
    """
    rows = get_daily_report_data(start_date, end_date, department_id)
    
    if not rows:
        return {
            'total_weekly_hours': '00:00:00',
            'average_activity_percentage': 0.0,
            'most_productive_day': '-',
            'total_idle_time': '00:00:00',
            'attendance_days': 0,
            'app_usage_summary': [],
            'daily_productivity_trend': [],
            'weekly_work_hours': []
        }
        
    total_tracked_sec = sum(r['raw_tracked_seconds'] for r in rows)
    total_productive_sec = sum(r['raw_productive_seconds'] for r in rows)
    total_idle_sec = sum(r['raw_idle_seconds'] for r in rows)
    
    avg_activity = (total_productive_sec / total_tracked_sec * 100) if total_tracked_sec > 0 else 0.0
    
    # Calculate attendance days (unique user-dates)
    attendance_days = len(set((r['user_id'], r['date']) for r in rows))
    
    # Group by date to find most productive day
    day_productivity = {}
    for r in rows:
        dt = r['date']
        day_productivity[dt] = day_productivity.get(dt, 0) + r['raw_productive_seconds']
        
    most_productive_date = max(day_productivity, key=day_productivity.get) if day_productivity else '-'
    if most_productive_date != '-':
        parsed_date = datetime.date.fromisoformat(most_productive_date)
        most_productive_day = parsed_date.strftime('%A (%b %d)')
    else:
        most_productive_day = '-'

    # App Analytics for this week
    user_ids = list(set(r['user_id'] for r in rows))
    activities = AppActivity.objects.filter(
        user_id__in=user_ids,
        timestamp__date__range=(start_date, end_date)
    ).values('app_name').annotate(
        total_duration=Sum('duration_seconds'),
        total_productive=Sum('productive_seconds')
    ).order_by('-total_duration')[:10]
    
    app_usage = []
    for act in activities:
        cat = classify_app_activity(act['app_name'])
        app_usage.append({
            'app_name': act['app_name'],
            'duration_seconds': act['total_duration'],
            'duration_formatted': format_seconds(act['total_duration']),
            'is_productive': cat == 'productive',
            'category': cat.replace('_', ' ').title()
        })
        
    # Chart data: Daily productivity trend
    daily_trend = []
    temp_date = start_date
    while temp_date <= end_date:
        date_str = temp_date.isoformat()
        day_rows = [r for r in rows if r['date'] == date_str]
        
        day_prod = sum(r['raw_productive_seconds'] for r in day_rows) / 3600.0
        day_idle = sum(r['raw_idle_seconds'] for r in day_rows) / 3600.0
        
        daily_trend.append({
            'date': temp_date.strftime('%a, %b %d'),
            'productive_hours': round(day_prod, 2),
            'idle_hours': round(day_idle, 2),
        })
        temp_date += timedelta(days=1)
        
    # Chart data: User-wise hours
    user_hours = {}
    for r in rows:
        user_hours[r['full_name']] = user_hours.get(r['full_name'], 0) + r['raw_tracked_seconds']
        
    weekly_work_hours = [
        {'employee': name, 'hours': round(sec / 3600.0, 2)}
        for name, sec in user_hours.items()
    ]
    
    return {
        'total_weekly_hours': format_seconds(total_tracked_sec),
        'average_activity_percentage': round(min(100.0, avg_activity), 2),
        'most_productive_day': most_productive_day,
        'total_idle_time': format_seconds(total_idle_sec),
        'attendance_days': attendance_days,
        'app_usage_summary': app_usage,
        'daily_productivity_trend': daily_trend,
        'weekly_work_hours': weekly_work_hours
    }


def get_monthly_report_data(year, month, department_id=None):
    """
    Generate monthly reports including rankings and trends.
    """
    # Calculate start and end dates
    start_date = datetime.date(year, month, 1)
    if month == 12:
        end_date = datetime.date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = datetime.date(year, month + 1, 1) - timedelta(days=1)
        
    rows = get_daily_report_data(start_date, end_date, department_id)
    
    if not rows:
        return {
            'total_monthly_work_hours': '00:00:00',
            'total_productive_hours': '00:00:00',
            'total_idle_hours': '00:00:00',
            'attendance_summary': {
                'total_sessions': 0,
                'avg_sessions_per_day': 0.0,
                'unique_days_worked': 0
            },
            'employee_ranking': [],
            'productivity_trends': []
        }
        
    total_tracked_sec = sum(r['raw_tracked_seconds'] for r in rows)
    total_productive_sec = sum(r['raw_productive_seconds'] for r in rows)
    total_idle_sec = sum(r['raw_idle_seconds'] for r in rows)
    
    unique_days = len(set(r['date'] for r in rows))
    unique_employees = len(set(r['user_id'] for r in rows))
    
    # Employee ranking by productivity
    emp_stats = {}
    for r in rows:
        uid = r['user_id']
        if uid not in emp_stats:
            emp_stats[uid] = {
                'user_id': uid,
                'full_name': r['full_name'],
                'employee_code': r['employee_code'],
                'department': r['department'],
                'productive_sec': 0,
                'idle_sec': 0,
                'tracked_sec': 0
            }
        emp_stats[uid]['productive_sec'] += r['raw_productive_seconds']
        emp_stats[uid]['idle_sec'] += r['raw_idle_seconds']
        emp_stats[uid]['tracked_sec'] += r['raw_tracked_seconds']
        
    rankings = []
    for uid, stats in emp_stats.items():
        pct = (stats['productive_sec'] / stats['tracked_sec'] * 100) if stats['tracked_sec'] > 0 else 0.0
        rankings.append({
            'user_id': uid,
            'full_name': stats['full_name'],
            'employee_code': stats['employee_code'],
            'department': stats['department'],
            'productive_hours': round(stats['productive_sec'] / 3600.0, 2),
            'tracked_hours': round(stats['tracked_sec'] / 3600.0, 2),
            'activity_percentage': round(min(100.0, pct), 2)
        })
        
    rankings = sorted(rankings, key=lambda x: x['productive_hours'], reverse=True)
    
    # Monthly daily trends
    trends_grouped = {}
    temp_date = start_date
    while temp_date <= end_date:
        date_str = temp_date.isoformat()
        day_rows = [r for r in rows if r['date'] == date_str]
        
        day_prod = sum(r['raw_productive_seconds'] for r in day_rows) / 3600.0
        day_idle = sum(r['raw_idle_seconds'] for r in day_rows) / 3600.0
        
        trends_grouped[date_str] = {
            'date': temp_date.strftime('%b %d'),
            'productive_hours': round(day_prod, 2),
            'idle_hours': round(day_idle, 2)
        }
        temp_date += timedelta(days=1)
        
    return {
        'total_monthly_work_hours': format_seconds(total_tracked_sec),
        'total_productive_hours': format_seconds(total_productive_sec),
        'total_idle_hours': format_seconds(total_idle_sec),
        'attendance_summary': {
            'total_sessions': len(rows),
            'avg_sessions_per_day': round(len(rows) / max(1, unique_days), 1),
            'unique_days_worked': unique_days,
            'active_employees_count': unique_employees
        },
        'employee_ranking': rankings,
        'productivity_trends': list(trends_grouped.values())
    }


def get_employee_analytics_data(user, start_date, end_date):
    """
    Get detailed timeline metrics for a specific employee.
    """
    sessions = list(WorkSession.objects.filter(
        user=user,
        login_time__date__range=(start_date, end_date)
    ).order_by('login_time'))
    
    activities = list(AppActivity.objects.filter(
        user=user,
        timestamp__date__range=(start_date, end_date)
    ).order_by('timestamp'))
    
    # 1. Daily summaries
    full_name = user.name or f"{user.first_name} {user.last_name}".strip() or user.username
    emp_code = f"GS-26-{str(user.id).zfill(3)}"
    daily_summaries = {}
    from .utils import calculate_daily_metrics, format_duration
    
    # Generate list of dates in range
    date_list = []
    temp_date = start_date
    while temp_date <= end_date:
        date_list.append(temp_date)
        temp_date += timedelta(days=1)
        
    for d in date_list:
        day_sessions = [s for s in sessions if s.login_time.date() == d]
        if not day_sessions:
            continue
            
        first_login = min(s.login_time for s in day_sessions)
        last_active = max(s.logout_time or s.last_ping or s.login_time for s in day_sessions)
        
        metrics = calculate_daily_metrics(user, d)
        day_activities = [a for a in activities if a.timestamp.date() == d]
        break_analysis = detect_breaks_and_gaps(user, d, d, day_sessions, day_activities)
        
        dt_str = d.isoformat()
        daily_summaries[dt_str] = {
            # Ordered fields requested by USER
            'employee_name': full_name,
            'employee_code': emp_code,
            'department': user.department.name if user.department else 'General',
            'date': dt_str,
            'productive_time': format_duration(metrics['productive_time']),
            'idle_time': format_duration(metrics['non_productive_time']),
            'desktop_work_time': format_duration(metrics['desktop_work_time']),
            'portal_active_time': format_duration(metrics['portal_active_time']),
            'break_time': format_duration(metrics['break_time']),
            'unaccounted_time': format_duration(metrics['unaccounted_time']),
            'total_engagement_time': format_duration(metrics['total_engagement_time']),
            'workday_span': format_seconds(max(0, int((last_active - first_login).total_seconds()))),
            'activity_percentage': round(metrics['activity_percentage'], 2),
            'status': 'Offline',
            
            # Original fields for backward compatibility
            'first_login': first_login.isoformat(),
            'last_active': last_active.isoformat(),
            'total_tracked_time': format_duration(metrics['desktop_work_time']),
            'break_count': break_analysis['break_count']
        }
            
    # app activity grouping and classification
    app_stats = {}
    total_app_sec = 0
    
    for act in activities:
        cat = classify_app_activity(act.app_name, act.window_title)
        
        # App total times
        if act.app_name not in app_stats:
            app_stats[act.app_name] = {
                'app_name': act.app_name,
                'duration_seconds': 0,
                'productive_seconds': 0,
                'mouse_moves': 0,
                'key_presses': 0,
                'category': cat,
                'is_productive': cat == 'productive'
            }
        stats = app_stats[act.app_name]
        stats['duration_seconds'] += act.duration_seconds
        stats['productive_seconds'] += act.productive_seconds
        stats['mouse_moves'] += act.mouse_moves
        stats['key_presses'] += act.key_presses
        total_app_sec += act.duration_seconds

    # Format daily summaries
    formatted_daily = list(daily_summaries.values())

    # Format apps usage list
    formatted_apps = []
    for name, stats in sorted(app_stats.items(), key=lambda x: x[1]['duration_seconds'], reverse=True):
        pct = (stats['duration_seconds'] / total_app_sec * 100) if total_app_sec > 0 else 0.0
        formatted_apps.append({
            'app_name': stats['app_name'],
            'total_time': format_seconds(stats['duration_seconds']),
            'productive_time': format_seconds(stats['productive_seconds']),
            'mouse_moves': stats['mouse_moves'],
            'key_presses': stats['key_presses'],
            'category': stats['category'].replace('_', ' ').title(),
            'is_productive': stats['is_productive'],
            'percentage_of_total': round(pct, 2)
        })

    # Break details list
    break_analysis = detect_breaks_and_gaps(user, start_date, end_date, sessions, activities)
    formatted_breaks = []
    for b in break_analysis['breaks_list']:
        formatted_breaks.append({
            'start': b['start'].isoformat(),
            'end': b['end'].isoformat(),
            'duration': format_seconds(b['duration']),
            'type': b['type'],
            'description': b['description']
        })

    # Totals
    total_productive_all = 0
    total_idle_all = 0
    total_desktop_work_all = 0
    total_portal_active_all = 0
    total_break_all = 0
    total_unaccounted_all = 0
    total_engagement_all = 0
    total_break_count = 0
    
    for d in date_list:
        day_sessions = [s for s in sessions if s.login_time.date() == d]
        if not day_sessions:
            continue
        metrics = calculate_daily_metrics(user, d)
        total_productive_all += int(metrics['productive_time'].total_seconds())
        total_idle_all += int(metrics['non_productive_time'].total_seconds())
        total_desktop_work_all += int(metrics['desktop_work_time'].total_seconds())
        total_portal_active_all += int(metrics['portal_active_time'].total_seconds())
        total_break_all += int(metrics['break_time'].total_seconds())
        total_unaccounted_all += int(metrics['unaccounted_time'].total_seconds())
        total_engagement_all += int(metrics['total_engagement_time'].total_seconds())
        
        day_activities = [a for a in activities if a.timestamp.date() == d]
        day_breaks = detect_breaks_and_gaps(user, d, d, day_sessions, day_activities)
        total_break_count += day_breaks['break_count']
        
    avg_activity_all = (total_productive_all / total_desktop_work_all * 100) if total_desktop_work_all > 0 else 0.0
    
    full_name = user.name or f"{user.first_name} {user.last_name}".strip() or user.username
    emp_code = f"GS-26-{str(user.id).zfill(3)}"

    return {
        'employee': {
            'id': user.id,
            'username': user.username,
            'full_name': full_name,
            'email': user.email,
            'employee_code': emp_code,
            'department': user.department.name if user.department else 'General'
        },
        'totals': {
            'total_tracked_time': format_seconds(total_desktop_work_all),
            'productive_time': format_seconds(total_productive_all),
            'idle_time': format_seconds(total_idle_all),
            'desktop_work_time': format_seconds(total_desktop_work_all),
            'portal_active_time': format_seconds(total_portal_active_all),
            'break_time': format_seconds(total_break_all),
            'unaccounted_time': format_seconds(total_unaccounted_all),
            'total_engagement_time': format_seconds(total_engagement_all),
            'activity_percentage': round(min(100.0, avg_activity_all), 2),
            'break_count': total_break_count,
            'total_break_time': format_seconds(total_break_all)
        },
        'daily_breakdown': formatted_daily,
        'app_usage': formatted_apps,
        'breaks': formatted_breaks
    }


def get_reconciliation_report_data(start_date, end_date, department_id=None, search_query=None):
    """
    Get reconciliation report data for employees.
    Formula: Total Workday Span = Productive Time + Idle Time + Break Time + Unaccounted Time
    """
    users_query = User.objects.filter(is_active=True)
    if department_id:
        users_query = users_query.filter(department_id=department_id)
    if search_query:
        users_query = users_query.filter(
            Q(name__icontains=search_query) | 
            Q(username__icontains=search_query) | 
            Q(email__icontains=search_query)
        )
    users = list(users_query.select_related('role', 'department'))
    user_ids = [u.id for u in users]
    
    sessions = list(WorkSession.objects.filter(
        user_id__in=user_ids,
        login_time__date__range=(start_date, end_date)
    ).order_by('login_time'))
    
    activities = list(AppActivity.objects.filter(
        user_id__in=user_ids,
        timestamp__date__range=(start_date, end_date)
    ).order_by('timestamp'))
    
    user_data = {}
    for user in users:
        user_data[user.id] = {
            'user': user,
            'sessions': [],
            'activities': []
        }
        
    for s in sessions:
        if s.user_id in user_data:
            user_data[s.user_id]['sessions'].append(s)
            
    for a in activities:
        if a.user_id in user_data:
            user_data[a.user_id]['activities'].append(a)

    report_rows = []
    
    date_list = []
    temp_date = start_date
    while temp_date <= end_date:
        date_list.append(temp_date)
        temp_date += timedelta(days=1)
        
    for user_id, data in user_data.items():
        user = data['user']
        full_name = user.name or f"{user.first_name} {user.last_name}".strip() or user.username
        emp_code = f"GS-26-{str(user.id).zfill(3)}"
        
        for d in date_list:
            day_sessions = [s for s in data['sessions'] if s.login_time.date() == d]
            day_activities = [a for a in data['activities'] if a.timestamp.date() == d]
            
            if not day_sessions:
                continue
                
            first_login = min(s.login_time for s in day_sessions)
            last_active = max(s.logout_time or s.last_ping or s.login_time for s in day_sessions)
            spanned_duration = int((last_active - first_login).total_seconds())
            spanned_duration = max(0, spanned_duration)
            
            session_duration_sec = 0
            productive_sec = 0
            idle_sec = 0
            portal_active_sec = 0
            for s in day_sessions:
                s_end = s.logout_time or s.last_ping or timezone.now()
                s_elapsed = max(0, int((s_end - s.login_time).total_seconds()))
                session_duration_sec += s_elapsed
                
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
            
            break_analysis = detect_breaks_and_gaps(user, d, d, sessions_list=day_sessions, activities_list=day_activities)
            total_break_sec = break_analysis['total_break_seconds']
            
            offline_break_sec = sum(b['duration'] for b in break_analysis['breaks_list'] if b['type'] == 'offline')
            idle_break_sec = sum(b['duration'] for b in break_analysis['breaks_list'] if b['type'] == 'idle')
            
            reconciled_idle_sec = idle_sec
            reconciled_break_sec = offline_break_sec + idle_break_sec
            
            desktop_work_sec = productive_sec + reconciled_idle_sec
            total_engagement_sec = desktop_work_sec + portal_active_sec
            
            sum_accounted = productive_sec + reconciled_idle_sec + portal_active_sec + reconciled_break_sec
            unaccounted_sec = spanned_duration - sum_accounted
            
            # In-session metrics to verify formula: Session Duration = Productive + Idle + Portal Active + In-Session Break + Unaccounted
            sum_accounted_session = productive_sec + reconciled_idle_sec + portal_active_sec + idle_break_sec
            unaccounted_session_sec = session_duration_sec - sum_accounted_session
            
            # Latest session status
            tracking_status = day_sessions[-1].get_status() if d == timezone.now().date() else 'Offline'
            
            report_rows.append({
                # Ordered fields requested by USER
                'employee_name': full_name,
                'employee_code': emp_code,
                'department': user.department.name if user.department else 'General',
                'date': d.isoformat(),
                'productive_time': format_seconds(productive_sec),
                'idle_time': format_seconds(reconciled_idle_sec),
                'desktop_work_time': format_seconds(desktop_work_sec),
                'portal_active_time': format_seconds(portal_active_sec),
                'break_time': format_seconds(reconciled_break_sec),
                'unaccounted_time': format_seconds(unaccounted_sec),
                'total_engagement_time': format_seconds(total_engagement_sec),
                'workday_span': format_seconds(spanned_duration),
                'activity_percentage': round(min(100.0, (productive_sec / desktop_work_sec * 100) if desktop_work_sec > 0 else 0.0), 2),
                'status': tracking_status,
                
                # Original fields for backward compatibility
                'user_id': user.id,
                'username': user.username,
                'full_name': full_name,
                'first_seen': first_login.isoformat() if first_login else None,
                'last_active': last_active.isoformat() if last_active else None,
                'session_duration': format_seconds(session_duration_sec),
                'in_session_break_time': format_seconds(idle_break_sec),
                'unaccounted_session_time': format_seconds(unaccounted_session_sec),
                
                # Raw fields
                'raw_workday_span': spanned_duration,
                'raw_session_duration': session_duration_sec,
                'raw_productive_seconds': productive_sec,
                'raw_idle_seconds': reconciled_idle_sec,
                'raw_desktop_work_seconds': desktop_work_sec,
                'raw_portal_active_seconds': portal_active_sec,
                'raw_break_seconds': reconciled_break_sec,
                'raw_unaccounted_seconds': unaccounted_sec,
                'raw_total_engagement_seconds': total_engagement_sec,
                'raw_in_session_break_seconds': idle_break_sec,
                'raw_unaccounted_session_seconds': unaccounted_session_sec,
            })
            
    return report_rows


def get_session_audit_data(start_date, end_date, user_id=None):
    """
    Get audit metrics for tracking sessions.
    Identifies overlapping active sessions, duration discrepancies, and percentage anomalies.
    """
    sessions_query = WorkSession.objects.filter(login_time__date__range=(start_date, end_date))
    if user_id:
        sessions_query = sessions_query.filter(user_id=user_id)
    
    sessions = list(sessions_query.select_related('user').order_by('login_time'))
    
    active_sessions_by_user = {}
    for s in sessions:
        if s.is_active_session:
            if s.user_id not in active_sessions_by_user:
                active_sessions_by_user[s.user_id] = []
            active_sessions_by_user[s.user_id].append(s)
            
    audit_rows = []
    
    for s in sessions:
        user = s.user
        full_name = user.name or f"{user.first_name} {user.last_name}".strip() or user.username
        emp_code = f"GS-26-{str(user.id).zfill(3)}"
        
        last_active = s.logout_time or s.last_ping or s.login_time
        elapsed_sec = max(0, int((last_active - s.login_time).total_seconds()))
        
        prod_sec = s.productive_seconds
        idle_sec = s.idle_seconds
        tracked_sec = s.tracked_seconds
        act_pct = s.activity_percentage
        
        flags = []
        severity = 'Ok'
        
        if s.is_active_session and len(active_sessions_by_user.get(s.user_id, [])) > 1:
            flags.append("Multiple overlapping active sessions exist for user")
            severity = 'Critical'
            
        if prod_sec + idle_sec > elapsed_sec:
            flags.append(f"Productive + Idle ({prod_sec + idle_sec}s) exceeds elapsed session duration ({elapsed_sec}s)")
            severity = 'Warning'
        elif tracked_sec > elapsed_sec:
            flags.append(f"Tracked seconds ({tracked_sec}s) exceeds elapsed session duration ({elapsed_sec}s)")
            severity = 'Warning'
        elif act_pct > 100.0:
            flags.append(f"Activity percentage ({act_pct}%) exceeds 100%")
            severity = 'Warning'
            
        if tracked_sec != prod_sec + idle_sec:
            flags.append(f"Tracked seconds ({tracked_sec}s) does not equal Productive + Idle ({prod_sec + idle_sec}s)")
            if severity not in ['Critical', 'Warning']:
                severity = 'Info'
        if prod_sec < 0 or idle_sec < 0 or tracked_sec < 0:
            flags.append("Negative tracking values detected")
            severity = 'Warning'
            
        status_str = ", ".join(flags) if flags else "Valid"
        
        audit_rows.append({
            'user_id': user.id,
            'username': user.username,
            'full_name': full_name,
            'employee_code': emp_code,
            'session_id': s.id,
            'device_id': s.device_id,
            'login_time': s.login_time.isoformat(),
            'last_active': last_active.isoformat(),
            'session_duration': format_seconds(elapsed_sec),
            'productive_time': format_seconds(prod_sec),
            'idle_time': format_seconds(idle_sec),
            'tracked_time': format_seconds(tracked_sec),
            'activity_percentage': round(act_pct, 2),
            'validation_status': status_str,
            'severity': severity,
            'raw_elapsed_seconds': elapsed_sec,
            'raw_productive_seconds': prod_sec,
            'raw_idle_seconds': idle_sec,
            'raw_tracked_seconds': tracked_sec,
        })
        
    return audit_rows
