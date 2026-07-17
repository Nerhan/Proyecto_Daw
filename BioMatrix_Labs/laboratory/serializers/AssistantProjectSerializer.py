from rest_framework import serializers
from laboratory.models.AssistantProject import AssistantProject
from laboratory.serializers.audit import AuditFieldsMixin

class AssistantProjectSerializer(AuditFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = AssistantProject
        fields = [
            'id', 'assistants', 'projects', 'assignment_date', 'status',
            'created', 'modified', 'created_by', 'modified_by',
        ]
