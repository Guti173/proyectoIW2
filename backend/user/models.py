from django.db import models

class User(models.Model):
    ROLE_USER = "user"
    ROLE_ADMIN = "admin"
    ROLE_CHOICES = [
        (ROLE_USER, "User"),
        (ROLE_ADMIN, "Admin"),
    ]

    username = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    email = models.CharField(max_length=255)
    nombre = models.CharField(max_length=255)
    apellidos = models.CharField(max_length=255)
    fotoPerfil = models.CharField(max_length=255)
    estadoCuenta = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_USER)
