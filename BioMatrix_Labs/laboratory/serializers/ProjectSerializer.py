from rest_framework import serializers
from laboratory.models.Project import Project
from laboratory.serializers.ScientistSerializer import ScientistSerializer

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'project_name', 'funding_source', 'budget', 'description', 'scientists', 'status']

# Serializador anidado para GET complejas
class ProjectDetailSerializer(serializers.ModelSerializer):
    scientists = ScientistSerializer(read_only=True) # Anidamiento complejo

    class Meta:
        model = Project
        fields = ['id', 'project_name', 'funding_source', 'budget', 'description', 'scientists', 'status']