from rest_framework import serializers
from laboratory.models.Scientist import Scientist
from laboratory.serializers.account_mixin import AccountLinkedSerializerMixin

class ScientistSerializer(AccountLinkedSerializerMixin, serializers.ModelSerializer):
    account_role = 'scientist'

    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    user_email = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Scientist
        fields = [
            'id', 'names', 'father_surname', 'mother_surname', 'specialty', 'license_number', 'phone',
            'status', 'email', 'password', 'user_email',
        ]
