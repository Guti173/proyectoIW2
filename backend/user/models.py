from django.db import models
from module.models import Module

class Group(models.Model):
    groupName = models.CharField(max_length=255)
    module = models.ForeignKey(Module, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.groupName

class User(models.Model):
    username = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    email = models.CharField(max_length=255)
    nombre = models.CharField(max_length=255)
    apellidos = models.CharField(max_length=255)
    fotoPerfil = models.CharField(max_length=255)
    estadoCuenta = models.CharField(max_length=255)
    group = models.ForeignKey(Group, on_delete=models.SET_NULL, null=True)