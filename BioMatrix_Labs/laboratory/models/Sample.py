import uuid
from django.db import models
from .User import User
from .Project import Project
from laboratory.validators import validate_storage_temperature

class Sample(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    sample_type = models.CharField(max_length=100)
    storage_temperature = models.DecimalField(decimal_places=2, max_digits=5, null=True, blank=True, validators=[validate_storage_temperature])
    collection_date = models.DateTimeField(auto_now_add=True)
    description = models.TextField(null=True, blank=True)
    
    projects = models.ForeignKey(Project, on_delete=models.CASCADE, db_column='projects_id')
    
    status = models.CharField(max_length=20, default='active')
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    created_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='samples_created', db_column='created_id')
    modified_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='samples_modified', db_column='modified_id')

    class Meta:
        db_table = 'samples'

    def __str__(self):
        return f"Muestra: {self.sample_type} ({self.storage_temperature}°C)"

    def save(self, *args, **kwargs):
        if self.sample_type:
            self.sample_type = self.sample_type.strip().lower()
        super(Sample, self).save(*args, **kwargs)