from django.db import models
from user.models import User
from serie.models import Serie

class Comentario(models.Model):
    contenido = models.TextField()
    fechaPublicacion = models.DateField()
    estado = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    serie = models.ForeignKey(Serie, on_delete=models.CASCADE)
    contadorLikes = models.IntegerField(default=0)

class Valoracion(models.Model):
    puntuacion = models.IntegerField()
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    serie = models.ForeignKey(Serie, on_delete=models.CASCADE)