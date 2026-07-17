from rest_framework import serializers
from laboratory.models.Test import Test
from laboratory.serializers.audit import AuditFieldsMixin

class TestSerializer(AuditFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = Test
        fields = [
            'id', 'test_name', 'protocol_description', 'estimated_duration', 'status',
            'created', 'modified', 'created_by', 'modified_by',
        ]
