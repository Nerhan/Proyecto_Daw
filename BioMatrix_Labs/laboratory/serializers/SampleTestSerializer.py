from rest_framework import serializers
from laboratory.models.SampleTest import SampleTest

class SampleTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = SampleTest
        fields = ['id', 'samples', 'tests', 'assistants', 'scientists', 'result_data', 'test_date', 'status']