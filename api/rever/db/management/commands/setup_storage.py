import sys

import boto3
from botocore.exceptions import ClientError
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Setup and verify MinIO storage configuration"

    def handle(self, *args, **options):
        """
        Main entry point for the command.
        Orchestrates the setup and verification process:
        1. Checks connection to MinIO
        2. Ensures the target bucket exists
        3. Tests file upload/delete operations
        4. Lists existing files
        """
        self.stdout.write(self.style.MIGRATE_HEADING("MinIO Storage Configuration Setup"))

        # 1. Check Connection
        # Verify that we can authenticate with the MinIO server using provided credentials
        s3_client = self.check_minio_connection()
        if not s3_client:
            self.stdout.write(self.style.ERROR("❌ Cannot proceed without MinIO connection"))
            sys.exit(1)

        # 2. Create Bucket
        # Ensure the configured bucket exists, creating it if necessary
        bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        if not self.create_bucket_if_not_exists(s3_client, bucket_name):
            self.stdout.write(self.style.ERROR("❌ Cannot proceed without bucket"))
            sys.exit(1)

        # 3. Test File Operations
        # Verify that Django's storage backend can actually write and read files
        if self.test_file_upload():
            self.stdout.write(self.style.SUCCESS("\n✅ MinIO storage is working correctly!"))
        else:
            self.stdout.write(self.style.ERROR("\n❌ MinIO storage test failed"))

        # 4. List Files
        # Show current contents to verify visibility
        self.list_bucket_files(s3_client, bucket_name)

    def check_minio_connection(self):
        """
        Check if MinIO is accessible.
        Attempts to list buckets to verify credentials and connectivity.
        """
        self.stdout.write("\n🔍 Checking MinIO connection...")
        self.stdout.write(f"   Endpoint: {settings.AWS_S3_ENDPOINT_URL}")
        self.stdout.write(f"   Bucket: {settings.AWS_STORAGE_BUCKET_NAME}")

        try:
            # Initialize Boto3 client directly to test raw connectivity
            s3_client = boto3.client(
                "s3",
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME,
            )

            # List buckets to verify permissions
            response = s3_client.list_buckets()
            self.stdout.write(self.style.SUCCESS("✅ Connected to MinIO successfully!"))
            buckets = [b["Name"] for b in response["Buckets"]]
            self.stdout.write(f"   Existing buckets: {buckets}")
            return s3_client

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Failed to connect to MinIO: {e}"))
            return None

    def create_bucket_if_not_exists(self, s3_client, bucket_name):
        """
        Create bucket if it doesn't exist.
        Handles 404 errors by creating the bucket.
        """
        self.stdout.write(f"\n🪣 Checking bucket '{bucket_name}'...")

        try:
            # Check if bucket exists
            s3_client.head_bucket(Bucket=bucket_name)
            self.stdout.write(self.style.SUCCESS(f"✅ Bucket '{bucket_name}' already exists"))
            return True
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "404":
                self.stdout.write(
                    self.style.WARNING(f"⚠️  Bucket '{bucket_name}' does not exist. Creating...")
                )
                try:
                    # Create bucket if missing
                    s3_client.create_bucket(Bucket=bucket_name)
                    self.stdout.write(self.style.SUCCESS(f"✅ Created bucket '{bucket_name}'"))
                    return True
                except Exception as create_error:
                    self.stdout.write(
                        self.style.ERROR(f"❌ Failed to create bucket: {create_error}")
                    )
                    return False
            else:
                self.stdout.write(self.style.ERROR(f"❌ Error checking bucket: {e}"))
                return False

    def test_file_upload(self):
        """
        Test file upload using Django's default_storage.
        This ensures the Django-Storages integration is working, not just raw Boto3.
        """
        self.stdout.write("\n📤 Testing file upload...")

        test_content = b"This is a test file for MinIO storage"
        test_filename = "test/minio_test.txt"

        try:
            # Save file using default storage (Django abstraction)
            path = default_storage.save(test_filename, ContentFile(test_content))
            self.stdout.write(self.style.SUCCESS(f"✅ File uploaded successfully: {path}"))

            # Get URL to verify public/presigned URL generation
            url = default_storage.url(path)
            self.stdout.write(f"   URL: {url}")

            # Check if file exists via storage API
            exists = default_storage.exists(path)
            self.stdout.write(f"   Exists: {exists}")

            # Clean up: Delete test file
            default_storage.delete(path)
            self.stdout.write(self.style.SUCCESS("✅ Test file deleted"))

            return True

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ File upload failed: {e}"))
            return False

    def list_bucket_files(self, s3_client, bucket_name, prefix=""):
        """
        List files in bucket to verify content visibility.
        """
        self.stdout.write(f"\n📂 Listing files in bucket '{bucket_name}'...")

        try:
            response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=prefix, MaxKeys=20)

            if "Contents" in response:
                self.stdout.write(f"   Found {len(response['Contents'])} files:")
                for obj in response["Contents"][:10]:  # Show first 10
                    self.stdout.write(f"   - {obj['Key']} ({obj['Size']} bytes)")
            else:
                self.stdout.write("   No files found in bucket")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Failed to list files: {e}"))
