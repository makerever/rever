# Generated by Django 5.2 on 2025-05-29 07:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0017_alter_approvalassignment_approver'),
    ]

    operations = [
        migrations.AlterField(
            model_name='bill',
            name='payment_terms',
            field=models.CharField(blank=True, choices=[('net15', 'Net\xa015'), ('net30', 'Net\xa030'), ('net45', 'Net\xa045'), ('due', 'Due\xa0on\xa0receipt')], max_length=8, null=True),
        ),
        migrations.AlterField(
            model_name='vendor',
            name='payment_terms',
            field=models.CharField(blank=True, choices=[('net15', 'Net\xa015'), ('net30', 'Net\xa030'), ('net45', 'Net\xa045'), ('due', 'Due\xa0on\xa0receipt')], max_length=8, null=True),
        ),
    ]