# Generated by Django 5.2.1 on 2025-07-03 05:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0055_matchmatrix'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='matchmatrix',
            constraint=models.UniqueConstraint(fields=('bill_item', 'purchase_order_item'), name='unique_matrix_pair'),
        ),
    ]
