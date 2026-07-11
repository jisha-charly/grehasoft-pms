from django.core.management.base import BaseCommand
from apps.seo.models import SEOActivityType

class Command(BaseCommand):
    help = "Seed default SEO Activity Types"

    def handle(self, *args, **options):
        activity_types = [
            "Article Submission",
            "Blog Submission",
            "Bookmarking",
            "Classified Submission",
            "Directory Submission",
            "Guest Posting",
            "Keyword Research",
            "Keyword Optimization",
            "Backlink Creation",
            "On-Page SEO",
            "Technical SEO",
            "Content Optimization",
            "Image Optimization",
            "Internal Linking",
            "Google Business Profile Optimization",
            "Competitor Analysis",
            "Site Audit",
            "Page Speed Optimization",
            "Schema Markup",
            "Monthly SEO Report",
        ]

        self.stdout.write("Seeding default SEO Activity Types...")
        for index, name in enumerate(activity_types):
            activity_type, created = SEOActivityType.objects.get_or_create(
                name=name,
                defaults={
                    "is_active": True,
                    "display_order": index * 10,
                    "description": f"Default master data for {name}."
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created: {name}"))
            else:
                activity_type.display_order = index * 10
                activity_type.save()
                self.stdout.write(f"Updated order: {name}")

        self.stdout.write(self.style.SUCCESS("Successfully seeded SEO Activity Types."))
