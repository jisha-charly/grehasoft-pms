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
            
            # Total tracked, productive, and idle seconds from WorkSession records
            total_tracked_sec = sum(s.tracked_seconds for s in day_sessions)
            productive_sec = sum(s.productive_seconds for s in day_sessions)
            idle_sec = sum(s.idle_seconds for s in day_sessions)
            
            # Non-productive time based on classified app activity pings
            non_productive_sec = 0
            for act in day_activities:
                category = classify_app_activity(act.app_name, act.window_title)
                if category == 'non_productive':
                    non_productive_sec += act.duration_seconds
                    
            # Fall back to wall-clock session duration if tracked_seconds is 0 (legacy or web sessions)
            if total_tracked_sec == 0:
                total_tracked_sec = sum(get_session_duration(s, current_time).total_seconds() for s in day_sessions)
                if day_activities:
                    app_productive_sec = 0
                    for act in day_activities:
                        category = classify_app_activity(act.app_name, act.window_title)
                        active_sec = act.productive_seconds
                        if category == 'productive':
                            app_productive_sec += active_sec
                        elif category == 'non_productive':
                            pass
                        else:
                            app_productive_sec += active_sec  # neutral default to productive
                    productive_sec = app_productive_sec
                    idle_sec = max(0, total_tracked_sec - productive_sec - non_productive_sec)
                else:
                    # Web-only or legacy session: 100% productive, 0% idle
                    productive_sec = total_tracked_sec
                    idle_sec = 0
            
            # Activity Percentage
            activity_pct = (productive_sec / total_tracked_sec * 100) if total_tracked_sec > 0 else 0.0
            print(f"Daily Report Aggregation - User: {user.username}, Date: {d.isoformat()} - calculated productive seconds: {productive_sec}, calculated idle seconds: {idle_sec}, final report activity_percentage: {activity_pct}")
            
            # Breaks detection
            break_analysis = detect_breaks_and_gaps(user, d, d, sessions_list=day_sessions, activities_list=day_activities)
            break_count = break_analysis['break_count']
            
            # Latest session status
            latest_session = day_sessions[-1]
            tracking_status = latest_session.get_status() if d == timezone.now().date() else 'Offline'
            
            # Save calculations back to db WorkSessions if it's past day or session closed
            for s in day_sessions:
                if not s.is_active_session and (s.idle_seconds == 0 or s.break_count == 0):
                    session_breaks = detect_breaks_and_gaps(user, d, d, sessions_list=[s], activities_list=day_activities)
                    duration_sec = max(0, int(get_session_duration(s, current_time).total_seconds()))
                    
                    # Check if desktop session or web-only/legacy
                    is_desktop_session = s.last_desktop_ping is not None or s.app_activities.exists()
                    
                    if not is_desktop_session:
                        s.productive_seconds = duration_sec
                        s.idle_seconds = 0
                    else:
                        s.idle_seconds = max(0, duration_sec - s.productive_seconds)
                        
                    s.tracked_seconds = s.productive_seconds + s.idle_seconds
                    s.break_count = session_breaks['break_count']
                    if s.tracked_seconds > 0:
                        s.activity_percentage = min(100.0, (s.productive_seconds / s.tracked_seconds) * 100.0)
                    else:
                        s.activity_percentage = 0.0
                    s.save(update_fields=['productive_seconds', 'idle_seconds', 'tracked_seconds', 'break_count', 'activity_percentage'])

            report_rows.append({
                'user_id': user.id,
                'username': user.username,
                'full_name': full_name,
                'email': user.email,
                'employee_code': emp_code,
                'department': user.department.name if user.department else 'General',
                'date': d.isoformat(),
                'first_login': first_login.isoformat() if first_login else None,
                'last_active': last_active.isoformat() if last_active else None,
                'total_tracked_time': format_seconds(total_tracked_sec),
                'productive_time': format_seconds(productive_sec),
                'idle_time': format_seconds(idle_sec),
                'non_productive_time': format_seconds(non_productive_sec),
                'activity_percentage': round(min(100.0, activity_pct), 2),
                'break_count': break_count,
                'status': tracking_status,
                'raw_tracked_seconds': total_tracked_sec,
                'raw_productive_seconds': productive_sec,
                'raw_idle_seconds': idle_sec
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
    daily_summaries = {}
    current_time = timezone.now()
    
    for s in sessions:
        dt_str = s.login_time.date().isoformat()
        if dt_str not in daily_summaries:
            daily_summaries[dt_str] = {
                'date': dt_str,
                'first_login': s.login_time,
                'last_active': s.logout_time or s.last_ping,
                'tracked_seconds': 0,
                'productive_seconds': 0,
                'breaks_count': 0
            }
            
        summary = daily_summaries[dt_str]
        if s.tracked_seconds > 0:
            summary['tracked_seconds'] += s.tracked_seconds
            summary['productive_seconds'] += s.productive_seconds
        else:
            duration = get_session_duration(s, current_time).total_seconds()
            summary['tracked_seconds'] += duration
            
            # Check if there are any activities for this session
            session_has_activities = any(act.session_id == s.id for act in activities)
            if not session_has_activities:
                # Web-only session is 100% productive
                summary['productive_seconds'] += duration
            
        summary['first_login'] = min(summary['first_login'], s.login_time)
        summary['last_active'] = max(summary['last_active'], s.logout_time or s.last_ping or s.login_time)
            
    # app activity grouping and classification
    app_stats = {}
    total_app_sec = 0
    
    for act in activities:
        dt_str = act.timestamp.date().isoformat()
        cat = classify_app_activity(act.app_name, act.window_title)
        active_sec = act.productive_seconds
        
        # Only add productive seconds from app activity to daily summaries if session tracked_seconds was 0 (legacy/web sessions)
        if dt_str in daily_summaries:
            session_of_act = next((s for s in sessions if s.id == act.session_id), None)
            if session_of_act and session_of_act.tracked_seconds == 0:
                daily_summaries[dt_str]['productive_seconds'] += active_sec
            
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
    formatted_daily = []
    for dt_str, summary in sorted(daily_summaries.items()):
        total_tracked = summary['tracked_seconds']
        prod = summary['productive_seconds']
        idle = max(0, total_tracked - prod)
        pct = (prod / total_tracked * 100) if total_tracked > 0 else 0.0
        
        # Breaks for this day
        day_date = datetime.date.fromisoformat(dt_str)
        day_sessions = [s for s in sessions if s.login_time.date() == day_date]
        day_activities = [a for a in activities if a.timestamp.date() == day_date]
        break_analysis = detect_breaks_and_gaps(user, day_date, day_date, day_sessions, day_activities)
        
        formatted_daily.append({
            'date': dt_str,
            'first_login': summary['first_login'].isoformat(),
            'last_active': summary['last_active'].isoformat(),
            'total_tracked_time': format_seconds(total_tracked),
            'productive_time': format_seconds(prod),
            'idle_time': format_seconds(idle),
            'activity_percentage': round(min(100.0, pct), 2),
            'break_count': break_analysis['break_count']
        })

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
    total_tracked_all = sum(s['tracked_seconds'] for s in daily_summaries.values())
    total_productive_all = sum(s['productive_seconds'] for s in daily_summaries.values())
    total_idle_all = max(0, total_tracked_all - total_productive_all)
    avg_activity_all = (total_productive_all / total_tracked_all * 100) if total_tracked_all > 0 else 0.0
    
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
            'total_tracked_time': format_seconds(total_tracked_all),
            'productive_time': format_seconds(total_productive_all),
            'idle_time': format_seconds(total_idle_all),
            'activity_percentage': round(min(100.0, avg_activity_all), 2),
            'break_count': break_analysis['break_count'],
            'total_break_time': format_seconds(break_analysis['total_break_seconds'])
        },
        'daily_breakdown': formatted_daily,
        'app_usage': formatted_apps,
        'breaks': formatted_breaks
    }
