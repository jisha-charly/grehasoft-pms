from django.db import migrations

def seed_seo_activities(apps, schema_editor):
    SEOActivityType = apps.get_model("seo", "SEOActivityType")
    default_activities = [
        "Blog Submission",
        "Bookmarking",
        "Profile Creation",
        "Directory Submission",
        "Article Submission",
        "Web 2.0",
        "Image Submission",
        "PDF Submission",
        "PPT Submission",
        "Forum Submission",
        "Guest Posting",
        "Social Bookmarking",
        "Local Citation",
        "Classified Submission"
    ]
    for name in default_activities:
        SEOActivityType.objects.get_or_create(name=name)

def rollback_seo_activities(apps, schema_editor):
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('seo', '0004_seodailyworkproof'),
    ]

    operations = [
        migrations.RunPython(seed_seo_activities, rollback_seo_activities),
    ]
