from rest_framework import serializers
from laboratory.models.User import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'status', 'created', 'modified']

# SERIALIZADOR ANIDADO COMPLEJO (Nested JSON)
# Muestra el usuario junto con los detalles de su perfil asociado
class UserDetailSerializer(serializers.ModelSerializer):
    profile_details = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'status', 'created', 'modified', 'profile_details']

    def get_profile_details(self, obj):
        # Buscamos de forma dinámica si el usuario tiene un perfil asociado de científico o asistente
        if hasattr(obj, 'scientist'):
            from laboratory.serializers.ScientistSerializer import ScientistSerializer
            return ScientistSerializer(obj.scientist).data
        elif hasattr(obj, 'assistant'):
            from laboratory.serializers.AssistantSerializer import AssistantSerializer
            return AssistantSerializer(obj.assistant).data
        return None