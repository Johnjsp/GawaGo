export function getWorkerReviewSummary(worker) {
  const reviews = worker?.receivedReviews || [];
  const ratedReviews = reviews.filter((review) => review.rating != null);
  const total = ratedReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  return { reviews, averageRating: ratedReviews.length ? total / ratedReviews.length : null, ratingCount: ratedReviews.length };
}

export function getHouseholdReviewSummary(household) {
  return { reviews: household?.receivedFeedback || [] };
}
