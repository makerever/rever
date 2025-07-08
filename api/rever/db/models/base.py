import uuid

from crum import get_current_user
from django.db import models

from rever.db.mixins import AuditModel


class BaseModel(AuditModel):
    """Base model with UUID, full audit fields"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_index=True)

    class Meta:
        abstract = True

    def save(self, *args, created_by_id=None, disable_auto_set_user=False, **kwargs):
        if not disable_auto_set_user:
            user = get_current_user()
            if created_by_id:
                self.created_by_id = created_by_id
            elif user and not user.is_anonymous:
                if self._state.adding:
                    self.created_by = user
                else:
                    self.updated_by = user
        super().save(*args, **kwargs)

    def __str__(self):
        return str(self.id)
