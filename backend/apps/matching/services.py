from math import asin, cos, radians, sin, sqrt


def haversine_km(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return None
    if (float(lat1) == 0.0 and float(lon1) == 0.0) or (float(lat2) == 0.0 and float(lon2) == 0.0):
        return None
    r = 6371.0
    dlat = radians(float(lat2) - float(lat1))
    dlon = radians(float(lon2) - float(lon1))
    a = sin(dlat / 2) ** 2 + cos(radians(float(lat1))) * cos(radians(float(lat2))) * sin(dlon / 2) ** 2
    return 2 * r * asin(sqrt(a))


def build_match_results(job, worker_profiles):
    results = []
    for profile in worker_profiles:
        skills = profile.skills or []
        matches_skill = job.required_skill in skills
        distance_km = haversine_km(job.latitude, job.longitude, profile.latitude, profile.longitude)
        verification_score = 1 if profile.verification_status == "verified" else 0
        skill_score = 2 if matches_skill else 0
        distance_score = max(0, 10 - distance_km) if distance_km is not None else 0
        rating_score = float(profile.average_rating or 0)
        match_score = skill_score + verification_score + distance_score + rating_score
        results.append(
            {
                "worker_id": profile.user_id,
                "worker_username": profile.user.username,
                "skills": skills,
                "matches_skill": matches_skill,
                "verification_status": profile.verification_status,
                "distance_km": round(distance_km, 2) if distance_km is not None else None,
                "distance_label": f"{round(distance_km, 2)} km away" if distance_km is not None else "Distance not available",
                "match_score": round(match_score, 2),
                "rating_label": profile.display_rating,
            }
        )
    return sorted(
        results,
        key=lambda item: (
            0 if item["matches_skill"] else 1,
            0 if item["distance_km"] is not None else 1,
            item["distance_km"] if item["distance_km"] is not None else float("inf"),
            0 if item["verification_status"] == "verified" else 1,
            -item["match_score"],
        ),
    )
