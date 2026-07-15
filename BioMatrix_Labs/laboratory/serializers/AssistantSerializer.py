from rest_framework import serializers
from laboratory.models.Assistant import Assistant
from laboratory.serializers.account_mixin import AccountLinkedSerializerMixin

class AssistantSerializer(AccountLinkedSerializerMixin, serializers.ModelSerializer):
    account_role = 'assistant'

    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    user_email = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Assistant
        fields = [
            'id', 'names', 'father_surname', 'mother_surname', 'laboratory_zone', 'shift_hours', 'phone',
            'status', 'email', 'password', 'user_email',
        ]
