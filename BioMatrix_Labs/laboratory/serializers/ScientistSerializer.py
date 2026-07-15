from rest_framework import serializers
from laboratory.models.Scientist import Scientist

class ScientistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scientist
        fields = ['id', 'names', 'father_surname', 'mother_surname', 'specialty', 'license_number', 'phone', 'user', 'status']