from rest_framework import serializers
from laboratory.models.AssistantProject import AssistantProject

class AssistantProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssistantProject
        fields = ['id', 'assistants', 'projects', 'assignment_date', 'status']