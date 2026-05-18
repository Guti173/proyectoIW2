from rest_framework import serializers
from serie.serializers import SerieSerializer
from serie.models import Serie
from .models import ListaUsuario, ProgresoSerie

class ListaUsuarioSerializer(serializers.ModelSerializer):
    series = SerieSerializer(many=True, read_only=True)
    seriesIds = serializers.PrimaryKeyRelatedField(
        source='series',
        many=True,
        queryset=Serie.objects.all(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = ListaUsuario
        fields = '__all__'
        read_only_fields = ('user', 'fechaAgregado')

class ProgresoSerieSerializer(serializers.ModelSerializer):
    serieDetalle = SerieSerializer(source='serie', read_only=True)

    class Meta:
        model = ProgresoSerie
        fields = '__all__'
        read_only_fields = (
            'user',
            'fechaInicio',
            'fechaFin',
            'ultimaActualizacion',
            'estado',
        )
