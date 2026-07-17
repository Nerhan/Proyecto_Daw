from rest_framework import serializers
from laboratory.models.Sample import Sample
from laboratory.serializers.audit import AuditFieldsMixin

class SampleSerializer(AuditFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = Sample
        fields = [
            'id', 'sample_type', 'storage_temperature', 'collection_date', 'description', 'projects', 'status',
            'created', 'modified', 'created_by', 'modified_by',
        ]
