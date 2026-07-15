from rest_framework import serializers
from laboratory.models.Assistant import Assistant
from laboratory.serializers.account_mixin import AccountLinkedSerializerMixin

class AssistantSerializer(AccountLinkedSerializerMixin, serializers.ModelSerializer):
    account_role = 'assistant'

    # Cuenta de acceso vinculada 1 a 1: se crea/actualiza junto con el
    # perfil (ver AccountLinkedSerializerMixin), no se expone 'user' directo.
    email = serializers.EmailField(write_only=True, required=False, help_text='Email institucional de la cuenta de acceso')
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    user_email = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Assistant
        fields = [
            'id', 'names', 'father_surname', 'mother_surname', 'laboratory_zone', 'shift_hours', 'phone',
            'status', 'email', 'password', 'user_email',
        ]
