# Generated by Django 5.2 on 2025-05-26 11:11

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0016_usernotificationsetting'),
    ]

    operations = [
        migrations.AlterField(
            model_name='approvalassignment',
            name='approver',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL),
        ),
    ]
