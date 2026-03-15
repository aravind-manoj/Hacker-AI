import os
import boto3
from botocore.config import Config
from typing import Optional, Union, Dict, Any, List

from dotenv import load_dotenv
load_dotenv()

class S3Handler:
    def __init__(self, 
      endpoint_url: str, 
      access_key_id: str, 
      secret_access_key: str, 
      bucket_name: str, 
      public_url: str
      ):
        self.bucket_name = bucket_name
        self.public_url = public_url  
        self.s3_client = boto3.client(
            's3',
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            config=Config(signature_version='s3v4'),
            region_name='auto' 
        )

    def get_object_url(self, key: str) -> str:
        if not self.public_url:
            return key
        
        base = self.public_url.rstrip('/')
        clean_key = key.lstrip('/')
        return f"{base}/{clean_key}"

    def get_upload_url(self, key: str, content_type: str, expires_in: int = 3600) -> Dict[str, str]:
        try:
            params = {
                'Bucket': self.bucket_name,
                'Key': key,
                'ContentType': content_type
            }
            upload_url = self.s3_client.generate_presigned_url(
                ClientMethod='put_object',
                Params=params,
                ExpiresIn=expires_in
            )
            object_url = self.get_object_url(key)
            return {'uploadUrl': upload_url, 'ObjectUrl': object_url}
            
        except Exception as e:
            print(f"Error generating upload URL: {e}")
            raise

    def upload_object(self, file_obj: Union[bytes, Any], key: str) -> None:
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=file_obj
        )

    def download_object(self, key: str) -> bytes:
        response = self.s3_client.get_object(
            Bucket=self.bucket_name,
            Key=key
        )
        return response['Body'].read()

    def delete_object(self, key: str) -> None:
        self.s3_client.delete_object(
            Bucket=self.bucket_name,
            Key=key
        )

    def list_objects(self) -> List[Dict[str, Any]]:
        response = self.s3_client.list_objects_v2(
            Bucket=self.bucket_name
        )
        return response.get('Contents', [])

s3 = S3Handler(
    endpoint_url=os.getenv('R2_ENDPOINT', ''),
    access_key_id=os.getenv('R2_ACCESS_KEY_ID', ''),
    secret_access_key=os.getenv('R2_SECRET_ACCESS_KEY', ''),
    bucket_name=os.getenv('R2_BUCKET_NAME', ''),
    public_url=os.getenv('R2_PUBLIC_URL', '')
)