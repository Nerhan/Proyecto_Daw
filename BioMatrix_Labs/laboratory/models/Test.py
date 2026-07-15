import uuid
from django.db import models
from .User import User
from laboratory.validators import validate_positive_duration

class Test(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    test_name = models.CharField(max_length=150)
    protocol_description = models.TextField()
    estimated_duration = models.IntegerField(null=True, blank=True, validators=[validate_positive_duration])
    
    status = models.CharField(max_length=20, default='active')
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    created_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='tests_created', db_column='created_id')
    modified_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='tests_modified', db_column='modified_id')
    class Meta:
        db_table = 'tests'

    def __str__(self):
        return f"Protocolo: {self.test_name} ({self.estimated_duration} min)"

    def save(self, *args, **kwargs):
        if self.test_name:
            self.test_name = self.test_name.strip().title()
        super(Test, self).save(*args, **kwargs)