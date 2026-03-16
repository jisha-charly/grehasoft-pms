from celery import shared_task
import random
import requests
from .models import SEOAnalytics, Website, TechnicalSEO, Keyword, SocialMedia, Backlink

@shared_task
def collect_search_visibility():
    websites = Website.objects.all()
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    for site in websites:
        for m in months:
            SEOAnalytics.objects.update_or_create(
                website=site,
                month=m,
                defaults={"traffic": random.randint(2000, 8000)}
            )

@shared_task
def collect_technical_seo():
    for site in Website.objects.all():
        url = site.domain
        if not url.startswith("http"):
            url = f"https://{url}"
        
        try:
            api = f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={url}"
            r = requests.get(api)
            data = r.json()
            
            lcp = data.get("lighthouseResult", {}).get("audits", {}).get("largest-contentful-paint", {}).get("displayValue", "0").replace(' s', '')
            cls = data.get("lighthouseResult", {}).get("audits", {}).get("cumulative-layout-shift", {}).get("displayValue", "0")
            
            TechnicalSEO.objects.update_or_create(
                website=site,
                defaults={
                    "lcp": float(lcp) if lcp else 0.0,
                    "cls": float(cls) if cls else 0.0,
                    "broken_links": 0,
                    "sitemap_updated": True
                }
            )
        except Exception as e:
            print(f"Error checking {url}: {e}")

@shared_task
def update_keyword_rankings():
    for k in Keyword.objects.all():
        k.rank = random.randint(1, 10)
        k.save()

@shared_task
def update_social_metrics():
    for s in SocialMedia.objects.all():
        s.likes += random.randint(5, 20)
        s.reach += random.randint(50, 200)
        s.save()

@shared_task
def discover_backlinks():
    domains = ["techblog.com", "directory.com", "startuphub.io", "news.org", "webdev.site"]
    for site in Website.objects.all():
        Backlink.objects.get_or_create(
            website=site,
            url=f"https://{random.choice(domains)}/{random.randint(100,999)}",
            defaults={
                "link_type": "Backlink",
                "domain_authority": random.randint(30, 80),
                "status": "LIVE"
            }
        )
