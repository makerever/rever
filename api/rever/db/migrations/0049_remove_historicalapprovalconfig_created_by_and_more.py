# Generated by Django 5.2.1 on 2025-06-30 13:22

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0048_alter_billitem_options_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='historicalapprovalconfig',
            name='created_by',
        ),
        migrations.RemoveField(
            model_name='historicalapprovalconfig',
            name='history_user',
        ),
        migrations.RemoveField(
            model_name='historicalapprovalconfig',
            name='organization',
        ),
        migrations.RemoveField(
            model_name='historicalapprovalconfig',
            name='updated_by',
        ),
        migrations.RemoveField(
            model_name='historicalapprovalflow',
            name='approver',
        ),
        migrations.RemoveField(
            model_name='historicalapprovalflow',
            name='created_by',
        ),
        migrations.RemoveField(
            model_name='historicalapprovalflow',
            name='history_user',
        ),
        migrations.RemoveField(
            model_name='historicalapprovalflow',
            name='organization',
        ),
        migrations.RemoveField(
            model_name='historicalapprovalflow',
            name='updated_by',
        ),
        migrations.RemoveField(
            model_name='historicalapprovallog',
            name='approval_sent_by',
        ),
        migrations.RemoveField(
            model_name='historicalapprovallog',
            name='approved_by',
        ),
        migrations.RemoveField(
            model_name='historicalapprovallog',
            name='content_type',
        ),
        migrations.RemoveField(
            model_name='historicalapprovallog',
            name='created_by',
        ),
        migrations.RemoveField(
            model_name='historicalapprovallog',
            name='history_user',
        ),
        migrations.RemoveField(
            model_name='historicalapprovallog',
            name='organization',
        ),
        migrations.RemoveField(
            model_name='historicalapprovallog',
            name='updated_by',
        ),
        migrations.RemoveField(
            model_name='historicalattachment',
            name='content_type',
        ),
        migrations.RemoveField(
            model_name='historicalattachment',
            name='created_by',
        ),
        migrations.RemoveField(
            model_name='historicalattachment',
            name='history_user',
        ),
        migrations.RemoveField(
            model_name='historicalattachment',
            name='organization',
        ),
        migrations.RemoveField(
            model_name='historicalattachment',
            name='updated_by',
        ),
        migrations.RemoveField(
            model_name='historicalbankaccount',
            name='created_by',
        ),
        migrations.RemoveField(
            model_name='historicalbankaccount',
            name='history_user',
        ),
        migrations.RemoveField(
            model_name='historicalbankaccount',
            name='updated_by',
        ),
        migrations.RemoveField(
            model_name='historicalmatchresult',
            name='bill',
        ),
        migrations.RemoveField(
            model_name='historicalmatchresult',
            name='bill_item',
        ),
        migrations.RemoveField(
            model_name='historicalmatchresult',
            name='created_by',
        ),
        migrations.RemoveField(
            model_name='historicalmatchresult',
            name='history_user',
        ),
        migrations.RemoveField(
            model_name='historicalmatchresult',
            name='organization',
        ),
        migrations.RemoveField(
            model_name='historicalmatchresult',
            name='purchase_order',
        ),
        migrations.RemoveField(
            model_name='historicalmatchresult',
            name='purchase_order_item',
        ),
        migrations.RemoveField(
            model_name='historicalmatchresult',
            name='updated_by',
        ),
        migrations.RemoveField(
            model_name='historicalorganization',
            name='address',
        ),
        migrations.RemoveField(
            model_name='historicalorganization',
            name='created_by',
        ),
        migrations.RemoveField(
            model_name='historicalorganization',
            name='history_user',
        ),
        migrations.RemoveField(
            model_name='historicalorganization',
            name='updated_by',
        ),
        migrations.RemoveField(
            model_name='historicalusernotificationpreference',
            name='created_by',
        ),
        migrations.RemoveField(
            model_name='historicalusernotificationpreference',
            name='history_user',
        ),
        migrations.RemoveField(
            model_name='historicalusernotificationpreference',
            name='updated_by',
        ),
        migrations.RemoveField(
            model_name='historicalusernotificationpreference',
            name='user',
        ),
        migrations.DeleteModel(
            name='HistoricalAddress',
        ),
        migrations.DeleteModel(
            name='HistoricalApprovalConfig',
        ),
        migrations.DeleteModel(
            name='HistoricalApprovalFlow',
        ),
        migrations.DeleteModel(
            name='HistoricalApprovalLog',
        ),
        migrations.DeleteModel(
            name='HistoricalAttachment',
        ),
        migrations.DeleteModel(
            name='HistoricalBankAccount',
        ),
        migrations.DeleteModel(
            name='HistoricalMatchResult',
        ),
        migrations.DeleteModel(
            name='HistoricalOrganization',
        ),
        migrations.DeleteModel(
            name='HistoricalUserNotificationPreference',
        ),
    ]
