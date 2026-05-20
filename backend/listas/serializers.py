from rest_framework import serializers
from serie.serializers import SerieSerializer
from serie.models import Serie
from .models import ListaSerie, ListaUsuario, ProgresoSerie

class ListaUsuarioSerializer(serializers.ModelSerializer):
    series = SerieSerializer(many=True, read_only=True)
    representativeSerie = serializers.SerializerMethodField(read_only=True)
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

    def get_representativeSerie(self, obj):
        relation = (
            ListaSerie.objects
            .select_related('serie')
            .filter(lista=obj)
            .order_by('-fechaAgregado', '-id')
            .first()
        )

        if relation is None:
            return None

        return SerieSerializer(relation.serie).data

    def create(self, validated_data):
        series = validated_data.pop('series', [])
        lista = super().create(validated_data)
        self._sync_series_registros(lista, series)
        return lista

    def update(self, instance, validated_data):
        has_series = 'series' in validated_data
        series = validated_data.pop('series', [])
        lista = super().update(instance, validated_data)

        if has_series:
            self._sync_series_registros(lista, series)

        return lista

    def _sync_series_registros(self, lista, series):
        lista.series.set(series)
        ListaSerie.objects.filter(lista=lista).exclude(serie__in=series).delete()

        for serie in series:
            ListaSerie.objects.get_or_create(lista=lista, serie=serie)

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
