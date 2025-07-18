# Generated by Django 5.2.1 on 2025-06-17 07:06

import django.db.models.deletion
import simple_history.models
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0042_alter_bill_bill_number_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='HistoricalMatchResult',
            fields=[
                ('created_at', models.DateTimeField(blank=True, editable=False, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(blank=True, editable=False, verbose_name='Last Modified At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False)),
                ('match_type', models.CharField(default='two_way', max_length=30)),
                ('description_score', models.FloatField()),
                ('description_status', models.CharField(choices=[('matched', 'Matched'), ('partial', 'Partial'), ('mismatched', 'Mismatched')], max_length=20)),
                ('quantity_status', models.BooleanField()),
                ('unit_price_status', models.BooleanField()),
                ('overall_status', models.CharField(choices=[('matched', 'Matched'), ('partial', 'Partial'), ('mismatched', 'Mismatched')], max_length=20)),
                ('history_id', models.AutoField(primary_key=True, serialize=False)),
                ('history_date', models.DateTimeField(db_index=True)),
                ('history_change_reason', models.CharField(max_length=100, null=True)),
                ('history_type', models.CharField(choices=[('+', 'Created'), ('~', 'Changed'), ('-', 'Deleted')], max_length=1)),
                ('bill', models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='db.bill')),
                ('bill_item', models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='db.billitem')),
                ('created_by', models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
                ('history_user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
                ('purchase_order', models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='db.purchaseorder')),
                ('purchase_order_item', models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='db.purchaseorderitem')),
                ('updated_by', models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By')),
            ],
            options={
                'verbose_name': 'historical Match Result',
                'verbose_name_plural': 'historical Match Results',
                'ordering': ('-history_date', '-history_id'),
                'get_latest_by': ('history_date', 'history_id'),
            },
            bases=(simple_history.models.HistoricalChanges, models.Model),
        ),
        migrations.CreateModel(
            name='MatchResult',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('match_type', models.CharField(default='two_way', max_length=30)),
                ('description_score', models.FloatField()),
                ('description_status', models.CharField(choices=[('matched', 'Matched'), ('partial', 'Partial'), ('mismatched', 'Mismatched')], max_length=20)),
                ('quantity_status', models.BooleanField()),
                ('unit_price_status', models.BooleanField()),
                ('overall_status', models.CharField(choices=[('matched', 'Matched'), ('partial', 'Partial'), ('mismatched', 'Mismatched')], max_length=20)),
                ('bill', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='match_results', to='db.bill')),
                ('bill_item', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='match_result', to='db.billitem')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Created By')),
                ('purchase_order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='match_results', to='db.purchaseorder')),
                ('purchase_order_item', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='db.purchaseorderitem')),
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Last Modified By')),
            ],
            options={
                'verbose_name': 'Match Result',
                'verbose_name_plural': 'Match Results',
                'db_table': 'match_results',
                'indexes': [models.Index(fields=['bill'], name='match_resul_bill_id_89967a_idx'), models.Index(fields=['purchase_order'], name='match_resul_purchas_0b74cd_idx')],
            },
        ),
    ]
