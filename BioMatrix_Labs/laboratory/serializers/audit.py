from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers


class AuditFieldsMixin(serializers.Serializer):
    created_by = serializers.SerializerMethodField(read_only=True)
    modified_by = serializers.SerializerMethodField(read_only=True)

    @extend_schema_field(serializers.EmailField(allow_null=True))
    def get_created_by(self, obj):
        return obj.created_id.email if obj.created_id else None

    @extend_schema_field(serializers.EmailField(allow_null=True))
    def get_modified_by(self, obj):
        return obj.modified_id.email if obj.modified_id else None
