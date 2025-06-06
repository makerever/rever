from django.apps import apps
from rest_framework.response import Response
from rest_framework.views import APIView


class AuditTrailView(APIView):
    def get(self, request, model_name, object_id):
        possible_labels = ["rever", "db", "rever.db"]
        model = None
        for label in possible_labels:
            try:
                model = apps.get_model(label, model_name)
                break
            except LookupError:
                continue

        if not model:
            return Response({"error": f"Model {model_name} not found"}, status=404)

        history_model = model.history.model

        history_qs = history_model.objects.filter(id=object_id).order_by("-history_date")

        result = []
        for record in history_qs:
            changes = []
            delta = record.diff_against(record.prev_record) if record.prev_record else None
            if delta:
                for change in delta.changes:
                    changes.append(
                        {
                            "field": change.field,
                            "old": change.old,
                            "new": change.new,
                        }
                    )
            result.append(
                {
                    "changed_on": record.history_date,
                    "changed_by": str(record.history_user),
                    "event": record.get_history_type_display(),
                    "changes": changes,
                }
            )

        return Response(result)
