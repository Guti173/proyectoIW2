from django.db import models
from django.utils import timezone
from user.models import User

class Amistad(models.Model):
    ESTADO_PENDIENTE = 'Pendiente'
    ESTADO_ACEPTADA = 'Aceptada'
    ESTADO_DENEGADA = 'Denegada'
    ESTADOS = [
        (ESTADO_PENDIENTE, 'Pendiente'),
        (ESTADO_ACEPTADA, 'Aceptada'),
        (ESTADO_DENEGADA, 'Denegada'),
    ]

    estado = models.CharField(max_length=20, choices=ESTADOS, default=ESTADO_PENDIENTE)
    fechaSolicitud = models.DateTimeField(default=timezone.now)
    fechaRespuesta = models.DateTimeField(null=True, blank=True)
    fechaAmistad = models.DateTimeField(null=True, blank=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user2')

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'user2'],
                name='unique_solicitud_amistad_direccion',
            ),
        ]
        indexes = [
            models.Index(fields=['user', 'user2']),
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return f'{self.user} -> {self.user2} ({self.estado})'
