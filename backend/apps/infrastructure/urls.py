from rest_framework.routers import DefaultRouter

from .views import (
    ServerViewSet,
    DomainViewSet,
    WebsiteCredentialViewSet
)

router = DefaultRouter()

router.register("servers", ServerViewSet)
router.register("domains", DomainViewSet)
router.register("credentials", WebsiteCredentialViewSet)

urlpatterns = router.urls