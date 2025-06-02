from django.apps import AppConfig


class DbConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "rever.db"

    def ready(self):
        import rever.db.signals  # noqa: F401
