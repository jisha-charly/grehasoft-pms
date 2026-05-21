import os
import sys
import django
from datetime import timedelta

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.utils import timezone
from apps.tracking.models import WorkSession, AppActivity
from apps.tracking.reports import classify_app_activity, detect_breaks_and_gaps

def repair_sessions():
    print("Starting WorkSession repair script...")
    
    # Fetch all closed sessions
    sessions = WorkSession.objects.filter(is_active_session=False)
    print(f"Found {sessions.count()} closed work sessions to inspect.")
    
    repaired_count = 0
    
    for s in sessions:
        user = s.user
        # Calculate duration of the session
        if s.logout_time:
            duration = s.logout_time - s.login_time
        else:
            duration = s.last_ping - s.login_time
        duration_sec = max(0, int(duration.total_seconds()))
        
        # Check if desktop session or web-only/legacy
        # Check if last_desktop_ping is set, or if app activities exist
        has_app_activities = s.app_activities.exists()
        is_desktop_session = s.last_desktop_ping is not None or has_app_activities
        
        needs_repair = False
        reason = ""
        
        # Determine if it needs repair:
        # Case 1: tracked_seconds is 0
        # Case 2: tracked_seconds != productive_seconds + idle_seconds
        # Case 3: productive_seconds or idle_seconds calculation seems incorrect / out of sync with duration
        
        old_tracked = s.tracked_seconds
        old_productive = s.productive_seconds
        old_idle = s.idle_seconds
        old_activity_pct = s.activity_percentage
        old_break_count = s.break_count
        
        if s.tracked_seconds == 0:
            needs_repair = True
            reason = "tracked_seconds is 0"
        elif s.tracked_seconds != (s.productive_seconds + s.idle_seconds):
            needs_repair = True
            reason = f"tracked_seconds mismatch: {s.tracked_seconds} != {s.productive_seconds} + {s.idle_seconds}"
        
        if needs_repair:
            # Let's compute correct values
            if not is_desktop_session:
                # Web-only or legacy: 100% productive, 0% idle
                productive_sec = duration_sec
                idle_sec = 0
            else:
                # Desktop session
                if has_app_activities:
                    # Let's sum productive seconds from app activities
                    app_activities = s.app_activities.all()
                    app_productive_sec = 0
                    for act in app_activities:
                        category = classify_app_activity(act.app_name, act.window_title)
                        active_sec = act.productive_seconds if hasattr(act, 'productive_seconds') else act.duration_seconds
                        if category == 'productive':
                            app_productive_sec += active_sec
                        elif category == 'non_productive':
                            pass
                        else:
                            app_productive_sec += active_sec  # neutral default to productive
                    
                    productive_sec = app_productive_sec
                    idle_sec = max(0, duration_sec - productive_sec)
                else:
                    # Desktop ping but no activity logs (unlikely, but fallback to same as Web-only or 100% idle? Web-only fallback is safer if no activities)
                    productive_sec = duration_sec
                    idle_sec = 0
            
            tracked_sec = productive_sec + idle_sec
            
            # Recalculate break count
            session_breaks = detect_breaks_and_gaps(user, s.login_time.date(), s.login_time.date(), sessions_list=[s])
            break_count = session_breaks['break_count']
            
            if tracked_sec > 0:
                activity_pct = min(100.0, (productive_sec / tracked_sec) * 100.0)
            else:
                activity_pct = 0.0
                
            s.productive_seconds = productive_sec
            s.idle_seconds = idle_sec
            s.tracked_seconds = tracked_sec
            s.break_count = break_count
            s.activity_percentage = activity_pct
            
            s.save(update_fields=[
                'productive_seconds', 
                'idle_seconds', 
                'tracked_seconds', 
                'break_count', 
                'activity_percentage'
            ])
            
            print(f"Repaired Session ID {s.id} for User {user.username} ({s.login_time.date()}):")
            print(f"  Reason: {reason}")
            print(f"  Tracked: {old_tracked} -> {tracked_sec}")
            print(f"  Productive: {old_productive} -> {productive_sec}")
            print(f"  Idle: {old_idle} -> {idle_sec}")
            print(f"  Activity %: {old_activity_pct:.2f}% -> {activity_pct:.2f}%")
            print(f"  Break Count: {old_break_count} -> {break_count}")
            repaired_count += 1
            
    print(f"Repair complete. Repaired {repaired_count} sessions.")

if __name__ == "__main__":
    repair_sessions()
