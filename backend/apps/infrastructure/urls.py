from rest_framework.routers import DefaultRouter

from .views import ServerViewSet, DomainViewSet, WebsiteCredentialViewSet

router = DefaultRouter()
router.register(r"infrastructure/servers", ServerViewSet, basename="infra-servers")
router.register(r"infrastructure/domains", DomainViewSet, basename="infra-domains")
router.register(
    r"infrastructure/credentials",
    WebsiteCredentialViewSet,
    basename="infra-credentials",
)

urlpatterns = router.urls