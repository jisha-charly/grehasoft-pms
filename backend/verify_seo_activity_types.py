import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.seo.models import SEOActivityType

def main():
    print("Verifying SEOActivityType model and data...")
    types = list(SEOActivityType.objects.all())
    print(f"Total activity types in DB: {len(types)}")
    
    ordered_correctly = True
    for i in range(len(types) - 1):
        t1 = types[i]
        t2 = types[i+1]
        if t1.display_order > t2.display_order:
            ordered_correctly = False
            print(f"Ordering error: {t1.name} (order {t1.display_order}) is before {t2.name} (order {t2.display_order})")
        elif t1.display_order == t2.display_order and t1.name > t2.name:
            ordered_correctly = False
            print(f"Ordering error: {t1.name} is before {t2.name} (equal order {t1.display_order})")
            
    if ordered_correctly:
        print("Success: Default seed data ordering is correct (display_order ASC, name ASC).")
    else:
        print("Error: Default seed data ordering is incorrect.")

if __name__ == "__main__":
    main()
