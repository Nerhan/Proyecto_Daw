import uuid
from django.db import models
from .User import User
from .Scientist import Scientist
from laboratory.validators import validate_positive_budget

class Project(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    project_name = models.CharField(max_length=150)
    funding_source = models.CharField(max_length=150, null=True, blank=True)

    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, validators=[validate_positive_budget])
    description = models.TextField(null=True, blank=True)
    
    scientists = models.ForeignKey(Scientist, on_delete=models.RESTRICT, db_column='scientists_id')
    
    status = models.CharField(max_length=20, default='active')
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    created_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects_created', db_column='created_id')
    modified_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects_modified', db_column='modified_id')

    class Meta:
        db_table = 'projects'

    def __str__(self):
        return self.project_name

    def save(self, *args, **kwargs):
        if self.project_name:
            self.project_name = self.project_name.strip().upper()
        super(Project, self).save(*args, **kwargs)