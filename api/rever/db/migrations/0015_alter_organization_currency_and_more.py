# Generated by Django 5.2 on 2025-05-21 07:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0014_alter_bill_payment_terms'),
    ]

    operations = [
        migrations.AlterField(
            model_name='organization',
            name='currency',
            field=models.CharField(choices=[('USD', 'US Dollar ($)'), ('EUR', 'Euro (€)'), ('INR', 'Indian Rupee (₹)'), ('GBP', 'British Pound (£)'), ('JPY', 'Japanese Yen (¥)'), ('AUD', 'Australian Dollar (A$)'), ('CAD', 'Canadian Dollar (CA$)'), ('CHF', 'Swiss Franc (CHF)'), ('CNY', 'Chinese Yuan (¥)'), ('SGD', 'Singapore Dollar (S$)'), ('NZD', 'New Zealand Dollar (NZ$)'), ('SEK', 'Swedish Krona (kr)')], default='USD', max_length=3),
        ),
        migrations.AlterField(
            model_name='organization',
            name='date_format',
            field=models.CharField(choices=[('YYYY-MM-DD', 'YYYY-MM-DD'), ('DD-MM-YYYY', 'DD-MM-YYYY'), ('MM-DD-YYYY', 'MM-DD-YYYY')], default='MM-DD-YYYY', help_text='Date format to use throughout the application', max_length=10),
        ),
    ]
