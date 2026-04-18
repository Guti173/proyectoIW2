from django.db import models
from user.models import User

class Amistad(models.Model):
    estado = models.CharField(max_length=255)
    fechaSolicitud = models.DateField()
    fechaRespuesta = models.DateField(null=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user2')