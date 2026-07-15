import uuid
from django.db import models
from .User import User
from .Assistant import Assistant
from .Project import Project

class AssistantProject(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    assistants = models.ForeignKey(Assistant, on_delete=models.CASCADE, db_column='assistants_id')
    projects = models.ForeignKey(Project, on_delete=models.CASCADE, db_column='projects_id')
    assignment_date = models.DateTimeField(auto_now_add=True)
    
    status = models.CharField(max_length=20, default='active')
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    created_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ap_created', db_column='created_id')
    modified_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ap_modified', db_column='modified_id')

    class Meta:
        db_table = 'assistants_projects'
        unique_together = (('assistants', 'projects'),)

    def __str__(self):
        return f"{self.assistants} en {self.projects}"

    # REDEFINICIÓN DEL SAVE (Para asegurar consistencia en la entrega)
    def save(self, *args, **kwargs):
        # Operación previa: Asegurar que el estado esté en minúsculas por consistencia
        if self.status:
            self.status = self.status.lower()
        super(AssistantProject, self).save(*args, **kwargs)