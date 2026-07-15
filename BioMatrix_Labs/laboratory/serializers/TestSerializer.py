from rest_framework import serializers
from laboratory.models.Test import Test

class TestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Test
        fields = ['id', 'test_name', 'protocol_description', 'estimated_duration', 'status']