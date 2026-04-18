from django.db import models

class Module(models.Model):
    moduleId = models.CharField(max_length=255)
    moduleName = models.CharField(max_length=255)

    def __str__(self):
        return self.moduleName