from rest_framework import serializers
from laboratory.models.SampleTest import SampleTest
from laboratory.serializers.audit import AuditFieldsMixin

class SampleTestSerializer(AuditFieldsMixin, serializers.ModelSerializer):
    status = serializers.ChoiceField(choices=['pending', 'completed', 'rejected'], required=False)

    class Meta:
        model = SampleTest
        fields = [
            'id', 'samples', 'tests', 'assistants', 'scientists', 'result_data', 'test_date', 'status',
            'created', 'modified', 'created_by', 'modified_by',
        ]
