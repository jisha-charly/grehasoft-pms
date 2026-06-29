from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils.timezone import now
from django.db.models import Q
from apps.invoices.models import Invoice
from apps.projects.models import Project, Client
from apps.tasks.models import Task
from apps.reminders.models import Reminder
from datetime import date
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    today = now().date()
    role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None

    if role_name == 'CLIENT':
        client = user.get_associated_client()
        if not client:
            return Response({
                "is_client": True,
                "metrics": {
                    "active_projects": 0,
                    "completed_projects": 0,
                    "total_projects": 0,
                    "avg_progress": 0,
                    "completed_tasks": 0,
                    "pending_tasks": 0,
                    "current_milestone": "N/A",
                    "latest_work_update": "N/A",
                    "latest_report": "N/A"
                },
                "recent_activities": []
            })
            
        projects_qs = Project.objects.filter(client=client)
        active_projects_count = projects_qs.filter(status='in_progress').count()
        completed_projects_count = projects_qs.filter(status='completed').count()
        total_projects_count = projects_qs.count()
        
        from django.db.models import Avg
        avg_progress = projects_qs.aggregate(Avg('progress_percentage'))['progress_percentage__avg'] or 0
        
        # Tasks under these projects
        tasks_qs = Task.objects.filter(project__client=client)
        completed_tasks_count = tasks_qs.filter(status='done').count()
        pending_tasks_count = tasks_qs.exclude(status='done').count()
        
        # Current Milestone
        from apps.projects.models import Milestone
        current_milestone = Milestone.objects.filter(
            project__client=client, 
            status='in_progress'
        ).first() or Milestone.objects.filter(
            project__client=client
        ).order_by('-id').first()
        current_milestone_title = current_milestone.title if current_milestone else "No active milestones"
        
        # Latest Work Update
        from apps.seo.models import SEODailyWorkLog
        latest_work = SEODailyWorkLog.objects.filter(
            website__client=client, 
            status='approved'
        ).select_related('website').order_by('-log_date', '-id').first()
        latest_work_update = f"{latest_work.website.website_name} ({latest_work.log_date})" if latest_work else "No work updates yet"
        
        # Latest Report Upload
        from apps.tasks.models import TaskFile
        latest_file = TaskFile.objects.filter(
            task__project__client=client
        ).select_related('task__project').order_by('-id').first()
        latest_report = latest_file.file.name.split('/')[-1] if latest_file and hasattr(latest_file.file, 'name') else "No documents uploaded"
 
        # Recent activities
        from apps.activity.models import ActivityLog
        recent_logs = ActivityLog.objects.filter(
            project__client=client
        ).select_related('project').order_by('-created_at')[:10]
        recent_activities = []
        for rl in recent_logs:
            recent_activities.append({
                "id": rl.id,
                "action": rl.action,
                "created_at": rl.created_at,
                "project_name": rl.project.name if rl.project else None
            })
            
        data = {
            "is_client": True,
            "metrics": {
                "active_projects": active_projects_count,
                "completed_projects": completed_projects_count,
                "total_projects": total_projects_count,
                "avg_progress": round(avg_progress, 1),
                "completed_tasks": completed_tasks_count,
                "pending_tasks": pending_tasks_count,
                "current_milestone": current_milestone_title,
                "latest_work_update": latest_work_update,
                "latest_report": latest_report
            },
            "recent_activities": recent_activities
        }
        return Response(data)

    # Admin/Manager/Employee stats
    project_queryset = Project.objects.filter(
        Q(created_by=user) |
        Q(project_manager=user) |
        Q(members__user=user)
    ).distinct()
    
    active_clients = Client.objects.filter(
        projects__status='in_progress'
    ).distinct().count()
    
    data = {
        "projects": {
            "active": project_queryset.filter(status='in_progress').count(),
            "completed": project_queryset.filter(status='completed').count(),
            "total": project_queryset.count(),
        },
        "tasks": {
            "completed": Task.objects.filter(status='done').count(),
            "pending": Task.objects.filter(status__in=['todo', 'in_progress']).count(),
        },
        "reminders": {
            "pending": Reminder.objects.filter(is_completed=False, due_date__gte=today).count(),
            "overdue": Reminder.objects.filter(is_completed=False, due_date__lt=today).count(),
            "completed": Reminder.objects.filter(is_completed=True).count(),
        },
        "clients": {
            "active": active_clients
        }
    }

    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def quarterly_report(request):
    user = request.user

    start_date = date(date.today().year, 4, 1)
    end_date = date(date.today().year, 6, 30)

    projects = Project.objects.filter(created_at__range=[start_date, end_date])
    tasks = Task.objects.filter(created_at__range=[start_date, end_date])
    completed_tasks = tasks.filter(status='done')

    efficiency = 0
    if tasks.count() > 0:
        efficiency = int((completed_tasks.count() / tasks.count()) * 100)

    invoices = Invoice.objects.filter(created_at__range=[start_date, end_date])
    revenue = sum(inv.amount for inv in invoices)

    data = {
        "project_summary": projects.filter(status='in_progress').count(),
        "efficiency": efficiency,
        "tasks_created": tasks.count(),
        "tasks_done": completed_tasks.count(),
        "revenue": revenue,
        "satisfaction": 4.5
    }

    return Response(data)

class ClientDocumentPagination(PageNumberPagination):
    page_size = 10

class ClientDocumentsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        if role_name != 'CLIENT':
            from apps.projects.utils import log_failed_attempt
            log_failed_attempt(user, "Tried to access client documents view without being a CLIENT")
            return Response({"error": "Unauthorized"}, status=403)

        client = user.get_associated_client()
        if not client:
            return Response([])

        search_query = request.query_params.get("search", "").lower()
        doc_type = request.query_params.get("type", "")
        start_date_str = request.query_params.get("start_date", "")
        end_date_str = request.query_params.get("end_date", "")

        from django.utils.dateparse import parse_date
        start_date_val = parse_date(start_date_str) if start_date_str else None
        end_date_val = parse_date(end_date_str) if end_date_str else None

        documents = []

        # 1. Proposals
        if not doc_type or doc_type == "proposal":
            from apps.proposals.models import Proposal
            proposals = Proposal.objects.filter(client=client).select_related('project')
            for p in proposals:
                p_date = p.created_at.date() if hasattr(p.created_at, 'date') else p.created_at
                if start_date_val and p_date and p_date < start_date_val:
                    continue
                if end_date_val and p_date and p_date > end_date_val:
                    continue
                    
                name = f"Proposal: {p.title}"
                if search_query and search_query not in name.lower():
                    continue

                documents.append({
                    "id": f"proposal-{p.id}",
                    "name": name,
                    "type": "Proposal",
                    "project_name": p.project.name if p.project else "N/A",
                    "date": p_date.strftime("%Y-%m-%d") if p_date else "",
                    "url": f"/client/proposals/{p.id}",
                    "download_url": None,
                    "file_size": "~120 KB"
                })

        # 2. Invoices
        if not doc_type or doc_type == "invoice":
            from apps.invoices.models import Invoice
            invoices = Invoice.get_for_user(user)
            for inv in invoices:
                inv_date = inv.issue_date
                if start_date_val and inv_date and inv_date < start_date_val:
                    continue
                if end_date_val and inv_date and inv_date > end_date_val:
                    continue
                    
                name = f"Invoice: {inv.invoice_number}"
                if search_query and search_query not in name.lower():
                    continue

                documents.append({
                    "id": f"invoice-{inv.id}",
                    "name": name,
                    "type": "Invoice",
                    "project_name": "N/A",
                    "date": inv_date.strftime("%Y-%m-%d") if inv_date else "",
                    "url": f"/invoices/{inv.id}",
                    "download_url": f"/api/v1/invoices/{inv.id}/download/",
                    "file_size": "~95 KB"
                })

        # 3. TaskFiles (Project Attachments)
        if not doc_type or doc_type == "taskfile":
            from apps.tasks.models import TaskFile
            task_files = TaskFile.objects.filter(task__project__client=client).select_related('task__project')
            for tf in task_files:
                tf_date = tf.uploaded_at.date() if hasattr(tf.uploaded_at, 'date') else tf.uploaded_at
                if start_date_val and tf_date and tf_date < start_date_val:
                    continue
                if end_date_val and tf_date and tf_date > end_date_val:
                    continue
                    
                filename = tf.file.name.split("/")[-1] if hasattr(tf.file, 'name') else str(tf.file).split("/")[-1]
                if search_query and search_query not in filename.lower():
                    continue

                try:
                    size_bytes = tf.file.size
                    if size_bytes >= 1024 * 1024:
                        size_str = f"{round(size_bytes / (1024 * 1024), 2)} MB"
                    else:
                        size_str = f"{round(size_bytes / 1024, 2)} KB"
                except Exception:
                    size_str = "Unknown"

                documents.append({
                    "id": f"taskfile-{tf.id}",
                    "name": filename,
                    "type": "Task File",
                    "project_name": tf.task.project.name,
                    "date": tf_date.strftime("%Y-%m-%d") if tf_date else "",
                    "url": tf.file.url if hasattr(tf.file, 'url') else str(tf.file),
                    "download_url": tf.file.url if hasattr(tf.file, 'url') else str(tf.file),
                    "file_size": size_str
                })

        # 4. SEO Reports & Proofs
        if not doc_type or doc_type in ["seo_report", "seoreport"]:
            from apps.seo.models import SEODailyWorkLog, SEODailyWorkProof
            seo_logs = SEODailyWorkLog.objects.filter(website__client=client).exclude(proof_file='').exclude(proof_file__isnull=True).select_related('website')
            for log in seo_logs:
                log_date = log.log_date
                if start_date_val and log_date and log_date < start_date_val:
                    continue
                if end_date_val and log_date and log_date > end_date_val:
                    continue
                
                filename = log.proof_file.name.split("/")[-1] if hasattr(log.proof_file, 'name') else str(log.proof_file).split("/")[-1]
                name = f"SEO Proof: {filename} ({log.website.website_name})"
                if search_query and search_query not in name.lower():
                    continue

                documents.append({
                    "id": f"seolog-{log.id}",
                    "name": name,
                    "type": "SEO Report",
                    "project_name": f"SEO: {log.website.website_name}",
                    "date": log_date.strftime("%Y-%m-%d") if log_date else "",
                    "url": log.proof_file.url if hasattr(log.proof_file, 'url') else str(log.proof_file),
                    "download_url": log.proof_file.url if hasattr(log.proof_file, 'url') else str(log.proof_file),
                    "file_size": "Unknown"
                })

            seo_proofs = SEODailyWorkProof.objects.filter(work_log__website__client=client).select_related('work_log__website')
            for proof in seo_proofs:
                proof_date = proof.uploaded_at.date() if hasattr(proof.uploaded_at, 'date') else proof.uploaded_at
                if start_date_val and proof_date and proof_date < start_date_val:
                    continue
                if end_date_val and proof_date and proof_date > end_date_val:
                    continue

                filename = proof.proof_file.name.split("/")[-1] if hasattr(proof.proof_file, 'name') else str(proof.proof_file).split("/")[-1]
                name = f"SEO Proof: {filename} ({proof.work_log.website.website_name})"
                if search_query and search_query not in name.lower():
                    continue

                documents.append({
                    "id": f"seoproof-{proof.id}",
                    "name": name,
                    "type": "SEO Report",
                    "project_name": f"SEO: {proof.work_log.website.website_name}",
                    "date": proof_date.strftime("%Y-%m-%d") if proof_date else "",
                    "url": proof.proof_file.url if hasattr(proof.proof_file, 'url') else str(proof.proof_file),
                    "download_url": proof.proof_file.url if hasattr(proof.proof_file, 'url') else str(proof.proof_file),
                    "file_size": "Unknown"
                })

        # Sort documents by date descending
        documents.sort(key=lambda x: x["date"], reverse=True)

        paginator = ClientDocumentPagination()
        page = paginator.paginate_queryset(documents, request, view=self)
        if page is not None:
            return paginator.get_paginated_response(page)

        return Response(documents)

class ClientNotificationPagination(PageNumberPagination):
    page_size = 10

class ClientNotificationsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        if role_name != 'CLIENT':
            from apps.projects.utils import log_failed_attempt
            log_failed_attempt(user, "Tried to access client notifications view without being a CLIENT")
            return Response({"error": "Unauthorized"}, status=403)

        from apps.notifications.models import ClientNotification
        notifications = ClientNotification.objects.filter(user=user).order_by('-created_at')

        paginator = ClientNotificationPagination()
        page = paginator.paginate_queryset(notifications, request, view=self)
        
        serialized_data = []
        if page is not None:
            for n in page:
                serialized_data.append({
                    "id": n.id,
                    "title": n.title,
                    "message": n.message,
                    "notification_type": n.notification_type,
                    "read": n.read,
                    "created_at": n.created_at.strftime("%Y-%m-%d %H:%M:%S") if n.created_at else ""
                })
            return paginator.get_paginated_response(serialized_data)

        for n in notifications:
            serialized_data.append({
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "notification_type": n.notification_type,
                "read": n.read,
                "created_at": n.created_at.strftime("%Y-%m-%d %H:%M:%S") if n.created_at else ""
            })
        return Response(serialized_data)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):
    user = request.user
    role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
    if role_name != 'CLIENT':
        from apps.projects.utils import log_failed_attempt
        log_failed_attempt(user, "Tried to mark notification read without being a CLIENT")
        return Response({"error": "Unauthorized"}, status=403)

    from apps.notifications.models import ClientNotification
    try:
        notification = ClientNotification.objects.get(id=pk, user=user)
        notification.read = True
        notification.save()
        return Response({"status": "success", "message": "Notification marked as read."})
    except ClientNotification.DoesNotExist:
        from apps.projects.utils import log_failed_attempt
        log_failed_attempt(user, f"Tried to mark notification ID {pk} read (not owned or not found)")
        return Response({"error": "Notification not found."}, status=404)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    user = request.user
    role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
    if role_name != 'CLIENT':
        from apps.projects.utils import log_failed_attempt
        log_failed_attempt(user, "Tried to mark all notifications read without being a CLIENT")
        return Response({"error": "Unauthorized"}, status=403)

    from apps.notifications.models import ClientNotification
    ClientNotification.objects.filter(user=user, read=False).update(read=True)
    return Response({"status": "success", "message": "All notifications marked as read."})


class ClientDashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        if role_name != 'CLIENT':
            return Response({"error": "Unauthorized"}, status=403)

        client = user.get_associated_client()
        if not client:
            return Response({"error": "Associated client not found."}, status=404)

        # 1. Profile details
        profile = {
            "id": client.id,
            "name": client.name,
            "company_name": client.company_name or "",
            "email": client.email or "",
            "phone": client.phone or "",
        }

        # 2. Metrics
        from apps.projects.models import Project, Milestone
        from apps.seo.models import Website, SEOTask, SEODailyWorkLog
        from apps.tasks.models import Task, TaskFile
        from apps.invoices.models import Invoice
        from django.utils.timezone import localdate

        projects_qs = Project.objects.filter(client=client)
        websites_qs = Website.objects.filter(client=client)

        total_projects = projects_qs.count() + websites_qs.count()
        active_projects = projects_qs.filter(status='in_progress').count() + websites_qs.filter(status='active').count()
        completed_projects = projects_qs.filter(status='completed').count()

        # Department counts
        web_dev_count = projects_qs.filter(Q(department__name__icontains="website") | Q(department__name__icontains="development") | Q(name__icontains="website") | Q(name__icontains="development")).count()
        mobile_app_count = projects_qs.filter(Q(department__name__icontains="mobile") | Q(department__name__icontains="app") | Q(name__icontains="mobile") | Q(name__icontains="app")).count()
        seo_proj_count = websites_qs.count()
        branding_count = projects_qs.filter(Q(department__name__icontains="branding") | Q(name__icontains="branding") | Q(name__icontains="logo") | Q(name__icontains="design")).count()

        tasks_qs = Task.objects.filter(project__client=client)
        seo_tasks_qs = SEOTask.objects.filter(website__client=client)

        pending_tasks = tasks_qs.exclude(status='done').count()
        completed_tasks = tasks_qs.filter(status='done').count()
        pending_seo_tasks = seo_tasks_qs.filter(status='pending').count()
        completed_seo_tasks = seo_tasks_qs.filter(status='completed').count()

        today_date = localdate()
        today_work_updates = SEODailyWorkLog.objects.filter(website__client=client, log_date=today_date).count()

        files_qs = TaskFile.objects.filter(task__project__client=client)
        files_uploaded = files_qs.count()

        latest_file = files_qs.order_by('-uploaded_at').first()
        latest_report = latest_file.file.name.split('/')[-1] if latest_file and hasattr(latest_file.file, 'name') else "No Reports"

        milestones_qs = Milestone.objects.filter(project__client=client)
        current_m = milestones_qs.filter(status='in_progress').first() or milestones_qs.order_by('due_date').first()
        current_milestone = current_m.title if current_m else "N/A"

        invoices_qs = Invoice.get_for_user(user).prefetch_related('payments')
        all_invoices = list(invoices_qs)
        pending_invoices = sum(1 for inv in all_invoices if inv.status != 'paid')
        paid_invoices = sum(1 for inv in all_invoices if inv.status == 'paid')

        metrics = {
            "total_projects": total_projects,
            "active_projects": active_projects,
            "completed_projects": completed_projects,
            "website_development_projects": web_dev_count,
            "mobile_app_projects": mobile_app_count,
            "seo_projects": seo_proj_count,
            "branding_projects": branding_count,
            "pending_project_tasks": pending_tasks,
            "completed_project_tasks": completed_tasks,
            "pending_seo_tasks": pending_seo_tasks,
            "completed_seo_tasks": completed_seo_tasks,
            "today_work_updates": today_work_updates,
            "files_uploaded": files_uploaded,
            "latest_report": latest_report,
            "current_milestone": current_milestone,
            "pending_invoices": pending_invoices,
            "paid_invoices": paid_invoices,
        }

        # 3. Recent Activities (Unified Chronological Feed)
        from apps.activity.models import ActivityLog
        from apps.tasks.models import TaskComment
        from apps.proposals.models import Proposal
        recent_activities = []

        logs = ActivityLog.objects.filter(project__client=client).select_related('project', 'user').order_by('-created_at')[:15]
        for l in logs:
            recent_activities.append({
                "module": "projects",
                "activity_type": "status_change",
                "title": l.action,
                "description": f"Activity on project {l.project.name if l.project else 'N/A'}",
                "status": "completed",
                "performed_by": l.user.name or l.user.username if l.user else "System",
                "project": l.project.name if l.project else None,
                "website": None,
                "timestamp": l.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })

        comments = TaskComment.objects.filter(task__project__client=client).select_related('task__project', 'user').order_by('-created_at')[:15]
        for c in comments:
            recent_activities.append({
                "module": "tasks",
                "activity_type": "comment_added",
                "title": f"New Comment on task '{c.task.title}'",
                "description": c.comment,
                "status": "completed",
                "performed_by": c.user.name or c.user.username if c.user else "System",
                "project": c.task.project.name,
                "website": None,
                "timestamp": c.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })

        seo_tasks = SEOTask.objects.filter(website__client=client).select_related('website', 'created_by').order_by('-created_at')[:15]
        for st in seo_tasks:
            recent_activities.append({
                "module": "seo",
                "activity_type": "seo_task",
                "title": f"SEO Task: {st.title}",
                "description": st.description,
                "status": st.status,
                "performed_by": st.created_by.name or st.created_by.username if st.created_by else "SEO Team",
                "project": None,
                "website": st.website.website_name,
                "timestamp": st.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })

        seo_logs = SEODailyWorkLog.objects.filter(website__client=client).select_related('website', 'executive').order_by('-created_at')[:15]
        for log in seo_logs:
            recent_activities.append({
                "module": "seo",
                "activity_type": "daily_work_log",
                "title": f"SEO Work Log ({log.status})",
                "description": f"Submitted {log.total_count} activities for {log.log_date}",
                "status": log.status,
                "performed_by": log.executive.name or log.executive.username if log.executive else "SEO Team",
                "project": None,
                "website": log.website.website_name,
                "timestamp": log.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })

        invoices = Invoice.get_for_user(user).prefetch_related('payments').order_by('-created_at')[:15]
        for inv in invoices:
            recent_activities.append({
                "module": "invoices",
                "activity_type": "invoice_generated",
                "title": f"Invoice Generated: {inv.invoice_number}",
                "description": f"Total: Rs {inv.total}. Status: {inv.status}",
                "status": inv.status,
                "performed_by": "Billing System",
                "project": None,
                "website": None,
                "timestamp": inv.created_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(inv, 'created_at') and inv.created_at else inv.issue_date.strftime("%Y-%m-%d 00:00:00")
            })

        proposals = Proposal.objects.filter(client=client).select_related('project').order_by('-created_at')[:15]
        for prop in proposals:
            recent_activities.append({
                "module": "proposals",
                "activity_type": "proposal_created",
                "title": f"Proposal Created: {prop.title}",
                "description": f"Proposal for {prop.client.name}",
                "status": "completed",
                "performed_by": "Sales Team",
                "project": prop.project.name if prop.project else None,
                "website": None,
                "timestamp": prop.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })

        recent_activities.sort(key=lambda x: x["timestamp"], reverse=True)
        recent_activities = recent_activities[:15]

        # 4. Recent Documents
        recent_documents = []
        for inv in invoices[:5]:
            recent_documents.append({
                "id": f"invoice-{inv.id}",
                "name": f"Invoice: {inv.invoice_number}",
                "type": "Invoice",
                "project_name": "N/A",
                "date": inv.issue_date.strftime("%Y-%m-%d") if inv.issue_date else "",
                "url": f"/invoices/{inv.id}",
                "download_url": f"/api/v1/invoices/{inv.id}/download/"
            })
        for prop in proposals[:5]:
            p_date = prop.created_at.date() if hasattr(prop.created_at, 'date') else prop.created_at
            recent_documents.append({
                "id": f"proposal-{prop.id}",
                "name": f"Proposal: {prop.title}",
                "type": "Proposal",
                "project_name": prop.project.name if prop.project else "N/A",
                "date": p_date.strftime("%Y-%m-%d") if p_date else "",
                "url": f"/client/proposals/{prop.id}",
                "download_url": None
            })
        for tf in files_qs.order_by('-uploaded_at')[:5]:
            tf_date = tf.uploaded_at.date() if hasattr(tf.uploaded_at, 'date') else tf.uploaded_at
            filename = tf.file.name.split("/")[-1]
            recent_documents.append({
                "id": f"taskfile-{tf.id}",
                "name": filename,
                "type": "Task File",
                "project_name": tf.task.project.name,
                "date": tf_date.strftime("%Y-%m-%d") if tf_date else "",
                "url": tf.file.url if hasattr(tf.file, 'url') else str(tf.file),
                "download_url": tf.file.url if hasattr(tf.file, 'url') else str(tf.file)
            })

        # 5. Notifications
        from apps.notifications.models import ClientNotification
        notifications = ClientNotification.objects.filter(user=user, read=False).order_by('-created_at')[:10]
        recent_notifications = [{
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "notification_type": n.notification_type,
            "read": n.read,
            "created_at": n.created_at.strftime("%Y-%m-%d %H:%M:%S")
        } for n in notifications]

        # 6. Upcoming Deadlines
        upcoming_deadlines = []
        for t in tasks_qs.exclude(status='done').filter(due_date__gte=today_date).order_by('due_date')[:5]:
            upcoming_deadlines.append({
                "type": "Task",
                "title": t.title,
                "due_date": t.due_date.strftime("%Y-%m-%d"),
                "status": t.status,
                "project_name": t.project.name
            })
        for m in milestones_qs.exclude(status='completed').filter(due_date__gte=today_date).order_by('due_date')[:5]:
            upcoming_deadlines.append({
                "type": "Milestone",
                "title": m.title,
                "due_date": m.due_date.strftime("%Y-%m-%d"),
                "status": m.status,
                "project_name": m.project.name
            })
        for st in seo_tasks_qs.filter(status='pending', due_date__gte=today_date).order_by('due_date')[:5]:
            upcoming_deadlines.append({
                "type": "SEO Task",
                "title": st.title,
                "due_date": st.due_date.strftime("%Y-%m-%d"),
                "status": st.status,
                "project_name": f"SEO: {st.website.website_name}"
            })
        upcoming_deadlines.sort(key=lambda x: x["due_date"])
        upcoming_deadlines = upcoming_deadlines[:10]

        # 7. Latest Reports
        latest_reports = recent_documents[:5]

        # 8. Invoices list
        invoices_data = [{
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "total": str(inv.total),
            "status": inv.status,
            "issue_date": inv.issue_date.strftime("%Y-%m-%d") if inv.issue_date else "",
            "due_date": inv.due_date.strftime("%Y-%m-%d") if inv.due_date else ""
        } for inv in invoices[:10]]

        return Response({
            "profile": profile,
            "metrics": metrics,
            "recent_activities": recent_activities,
            "recent_documents": recent_documents,
            "recent_notifications": recent_notifications,
            "invoices": invoices_data,
            "latest_reports": latest_reports,
            "upcoming_deadlines": upcoming_deadlines
        })


class ClientProjectActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        user = request.user
        role_name = getattr(user.role, 'name', None) if hasattr(user, 'role') else None
        if role_name != 'CLIENT':
            return Response({"error": "Unauthorized"}, status=403)

        client = user.get_associated_client()
        if not client:
            return Response({"error": "Associated client not found."}, status=404)

        try:
            project = Project.objects.get(id=project_id, client=client)
        except Project.DoesNotExist:
            return Response({"error": "Project not found."}, status=404)

        from apps.activity.models import ActivityLog
        from apps.tasks.models import Task, TaskFile, TaskComment
        from apps.projects.models import Milestone
        from apps.invoices.models import Invoice
        from apps.proposals.models import Proposal
        from apps.seo.models import Website, SEOTask, SEODailyWorkLog, Keyword

        activities = []

        # 1. Project activity logs
        logs = ActivityLog.objects.filter(project=project).select_related('user').order_by('-created_at')
        for l in logs:
            activities.append({
                "module": "projects",
                "activity_type": "project_activity",
                "title": l.action,
                "description": f"Action on project {project.name}",
                "status": "completed",
                "performed_by": l.user.name or l.user.username if l.user else "System",
                "project": project.name,
                "website": None,
                "timestamp": l.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })

        # 2. Project Tasks
        tasks = Task.objects.filter(project=project).select_related('created_by')
        for t in tasks:
            activities.append({
                "module": "tasks",
                "activity_type": "task_updated",
                "title": f"Task: {t.title}",
                "description": t.description or "",
                "status": t.status,
                "performed_by": t.created_by.name or t.created_by.username if t.created_by else "System",
                "project": project.name,
                "website": None,
                "timestamp": t.created_at.strftime("%Y-%m-%d %H:%M:%S") if t.created_at else ""
            })

        # 3. Milestones
        milestones = Milestone.objects.filter(project=project)
        for m in milestones:
            m_timestamp = m.created_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(m, 'created_at') and m.created_at else m.due_date.strftime("%Y-%m-%d 00:00:00")
            activities.append({
                "module": "projects",
                "activity_type": "milestone_updated",
                "title": f"Milestone: {m.title}",
                "description": m.description or "",
                "status": m.status,
                "performed_by": "System",
                "project": project.name,
                "website": None,
                "timestamp": m_timestamp
            })

        # 4. File Uploads
        files = TaskFile.objects.filter(task__project=project).select_related('task')
        for f in files:
            activities.append({
                "module": "tasks",
                "activity_type": "file_upload",
                "title": f"File Uploaded: {f.file.name.split('/')[-1]}",
                "description": f"File uploaded on task '{f.task.title}'",
                "status": "completed",
                "performed_by": "Team Member",
                "project": project.name,
                "website": None,
                "timestamp": f.uploaded_at.strftime("%Y-%m-%d %H:%M:%S") if f.uploaded_at else ""
            })

        # 5. Client Comments
        comments = TaskComment.objects.filter(task__project=project).select_related('user', 'task')
        for c in comments:
            activities.append({
                "module": "tasks",
                "activity_type": "comment_added",
                "title": f"Comment on task '{c.task.title}'",
                "description": c.comment,
                "status": "completed",
                "performed_by": c.user.name or c.user.username if c.user else "System",
                "project": project.name,
                "website": None,
                "timestamp": c.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })

        # 6. Invoices & Proposals linked to client
        invoices = Invoice.objects.filter(client=client).prefetch_related('payments')
        for inv in invoices:
            activities.append({
                "module": "invoices",
                "activity_type": "invoice_generated",
                "title": f"Invoice: {inv.invoice_number}",
                "description": f"Invoice amount: Rs {inv.total}. Status: {inv.status}",
                "status": inv.status,
                "performed_by": "Billing System",
                "project": project.name,
                "website": None,
                "timestamp": inv.created_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(inv, 'created_at') and inv.created_at else inv.issue_date.strftime("%Y-%m-%d 00:00:00")
            })

        proposals = Proposal.objects.filter(client=client)
        for prop in proposals:
            activities.append({
                "module": "proposals",
                "activity_type": "proposal_created",
                "title": f"Proposal: {prop.title}",
                "description": f"Proposal for {prop.client.name}",
                "status": "completed",
                "performed_by": "Sales Team",
                "project": project.name,
                "website": None,
                "timestamp": prop.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })

        # 7. SEO Website Integration
        websites = Website.objects.filter(client=client)
        for w in websites:
            seo_tasks = SEOTask.objects.filter(website=w).select_related('created_by')
            for st in seo_tasks:
                activities.append({
                    "module": "seo",
                    "activity_type": "seo_task",
                    "title": f"SEO Task: {st.title}",
                    "description": st.description,
                    "status": st.status,
                    "performed_by": st.created_by.name or st.created_by.username if st.created_by else "SEO Team",
                    "project": project.name,
                    "website": w.website_name,
                    "timestamp": st.created_at.strftime("%Y-%m-%d %H:%M:%S") if st.created_at else st.due_date.strftime("%Y-%m-%d 00:00:00")
                })

            seo_logs = SEODailyWorkLog.objects.filter(website=w).select_related('executive')
            for log in seo_logs:
                activities.append({
                    "module": "seo",
                    "activity_type": "seo_daily_work",
                    "title": f"SEO Work Log ({log.status})",
                    "description": f"Log Date: {log.log_date}, Total activities: {log.total_count}",
                    "status": log.status,
                    "performed_by": log.executive.name or log.executive.username if log.executive else "SEO Team",
                    "project": project.name,
                    "website": w.website_name,
                    "timestamp": log.created_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(log, 'created_at') and log.created_at else log.log_date.strftime("%Y-%m-%d 00:00:00")
                })

            keywords = Keyword.objects.filter(website=w)
            for kw in keywords:
                activities.append({
                    "module": "seo",
                    "activity_type": "keyword_ranking_update",
                    "title": f"Keyword Ranking: {kw.keyword}",
                    "description": f"Rank: {kw.current_rank or 'N/A'} (Target: {kw.target_rank or 'N/A'})",
                    "status": "completed",
                    "performed_by": "SEO System",
                    "project": project.name,
                    "website": w.website_name,
                    "timestamp": kw.updated_at.strftime("%Y-%m-%d %H:%M:%S") if kw.updated_at else kw.created_at.strftime("%Y-%m-%d %H:%M:%S")
                })

        activities.sort(key=lambda x: x["timestamp"], reverse=True)

        return Response({
            "project_id": project.id,
            "project_name": project.name,
            "activities": activities
        })
