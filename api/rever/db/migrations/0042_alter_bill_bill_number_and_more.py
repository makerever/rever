# Generated by Django 5.2.1 on 2025-06-12 21:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0041_billcounter_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='bill',
            name='bill_number',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name='historicalbill',
            name='bill_number',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
