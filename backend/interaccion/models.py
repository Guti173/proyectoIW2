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

class ReporteComentario(models.Model):
    ESTADOS_REPORTE = [
        ('PENDIENTE', 'Pendiente'),
        ('ACEPTADO', 'Aceptado'),
        ('RECHAZADO', 'Rechazado'),
    ]
    comentario = models.ForeignKey(Comentario, on_delete=models.CASCADE)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    motivo = models.TextField()
    fechaReporte = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=ESTADOS_REPORTE, default='PENDIENTE')

    def __str__(self):
        return f"Reporte de {self.usuario.username} en comentario {self.comentario.id} - {self.estado}"