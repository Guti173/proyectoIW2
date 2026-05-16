from django.db import models
from module.models import Module

class Group(models.Model):
    groupName = models.CharField(max_length=255)
    module = models.ForeignKey(Module, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.groupName

class User(models.Model):
    auth0Sub = models.CharField(max_length=255, unique=True, null=True, blank=True)
    username = models.CharField(max_length=255, blank=True, default='')
    password = models.CharField(max_length=255, blank=True, default='')
    email = models.CharField(max_length=255, blank=True, default='')
    nombre = models.CharField(max_length=255, blank=True, default='')
    apellidos = models.CharField(max_length=255, blank=True, default='')
    fotoPerfil = models.CharField(max_length=255, blank=True, default='')
    estadoCuenta = models.CharField(max_length=255, blank=True, default='Activa')
    group = models.ForeignKey(Group, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.username or self.email or f'User {self.pk}'
