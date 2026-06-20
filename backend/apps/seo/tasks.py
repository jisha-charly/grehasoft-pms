from celery import shared_task
import random
from .models import Keyword

@shared_task
def update_keyword_rankings():
    for k in Keyword.objects.all():
        if k.current_rank is not None:
            # Simulate keyword rank movements slightly
            k.current_rank = max(1, k.current_rank + random.choice([-1, 0, 1]))
            k.save()
