from rest_framework import serializers
from laboratory.models.Project import Project
from laboratory.serializers.ScientistSerializer import ScientistSerializer
from laboratory.serializers.audit import AuditFieldsMixin

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'project_name', 'funding_source', 'budget', 'description', 'scientists', 'status']

class ProjectDetailSerializer(AuditFieldsMixin, serializers.ModelSerializer):
    scientists = ScientistSerializer(read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'project_name', 'funding_source', 'budget', 'description', 'scientists', 'status',
            'created', 'modified', 'created_by', 'modified_by',
        ]
