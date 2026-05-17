from django.db import models

class User(models.Model):
    ROLE_USER = "user"
    ROLE_ADMIN = "admin"
    ROLE_CHOICES = [
        (ROLE_USER, "User"),
        (ROLE_ADMIN, "Admin"),
    ]

    auth0Sub = models.CharField(max_length=255, unique=True, null=True, blank=True)
    username = models.CharField(max_length=255, blank=True, default='')
    password = models.CharField(max_length=255, blank=True, default='')
    email = models.CharField(max_length=255, blank=True, default='')
    nombre = models.CharField(max_length=255, blank=True, default='')
    apellidos = models.CharField(max_length=255, blank=True, default='')
    fotoPerfil = models.CharField(max_length=255, blank=True, default='')
    estadoCuenta = models.CharField(max_length=255, blank=True, default='Activa')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_USER)

    def __str__(self):
        return self.username or self.email or f'User {self.pk}'
