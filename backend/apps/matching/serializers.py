from rest_framework import serializers


class MatchRequestSerializer(serializers.Serializer):
    job_id = serializers.IntegerField()


class MatchResultSerializer(serializers.Serializer):
    worker_id = serializers.IntegerField()
    worker_username = serializers.CharField()
    skills = serializers.ListField(child=serializers.CharField())
    matches_skill = serializers.BooleanField()
    verification_status = serializers.CharField()
    worker_latitude = serializers.FloatField(allow_null=True)
    worker_longitude = serializers.FloatField(allow_null=True)
    distance_km = serializers.FloatField(allow_null=True)
    distance_label = serializers.CharField()
    match_score = serializers.FloatField()
    rating_label = serializers.CharField()
    rating_score = serializers.FloatField()
    available_at_requested_time = serializers.BooleanField()
    rate_score = serializers.FloatField()
    worker_rate = serializers.CharField(allow_blank=True)
