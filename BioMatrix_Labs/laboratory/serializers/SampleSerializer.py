from rest_framework import serializers
from laboratory.models.Sample import Sample

class SampleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sample
        fields = ['id', 'sample_type', 'storage_temperature', 'collection_date', 'description', 'projects', 'status']