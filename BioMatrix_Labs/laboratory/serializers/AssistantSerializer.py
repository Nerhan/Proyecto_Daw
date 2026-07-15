from rest_framework import serializers
from laboratory.models.Assistant import Assistant

class AssistantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assistant
        fields = ['id', 'names', 'father_surname', 'mother_surname', 'laboratory_zone', 'shift_hours', 'phone', 'user', 'status']