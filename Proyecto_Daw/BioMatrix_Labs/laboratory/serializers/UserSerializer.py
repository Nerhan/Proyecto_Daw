from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from laboratory.models.User import User
from laboratory.serializers.audit import AuditFieldsMixin

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'status', 'created', 'modified', 'password']
        read_only_fields = ['id', 'created', 'modified']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'Este campo es requerido para crear un usuario.'})
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

# SERIALIZADOR ANIDADO COMPLEJO (Nested JSON)
# Muestra el usuario junto con los detalles de su perfil asociado
class UserDetailSerializer(AuditFieldsMixin, serializers.ModelSerializer):
    profile_details = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'status', 'created', 'modified', 'profile_details', 'created_by', 'modified_by']

    @extend_schema_field(serializers.DictField(allow_null=True))
    def get_profile_details(self, obj):
        # Buscamos de forma dinámica si el usuario tiene un perfil asociado de científico o asistente
        if hasattr(obj, 'scientist'):
            from laboratory.serializers.ScientistSerializer import ScientistSerializer
            return ScientistSerializer(obj.scientist).data
        elif hasattr(obj, 'assistant'):
            from laboratory.serializers.AssistantSerializer import AssistantSerializer
            return AssistantSerializer(obj.assistant).data
        return None