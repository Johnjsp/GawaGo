import React, { useMemo, useState } from "react";

function formatUploadDate(value) {
  if (!value) return "Upload date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

export default function JobImageGallery({ images = [], loading = false }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const sortedImages = useMemo(
    () => [...images].sort((first, second) => (first.order ?? 0) - (second.order ?? 0)),
    [images],
  );

  if (loading) {
    return (
      <div className="job-image-gallery">
        <div className="job-image-gallery-grid">
          {[1, 2, 3].map((slot) => (
            <div className="job-image-skeleton" key={slot} />
          ))}
        </div>
      </div>
    );
  }

  if (sortedImages.length === 0) {
    return <p className="text-muted mb-0">No images uploaded for this job.</p>;
  }

  const activeImage = activeIndex != null ? sortedImages[activeIndex] : null;

  return (
    <div className="job-image-gallery">
      <div className="job-image-gallery-grid">
        {sortedImages.map((image, index) => (
          <button
            type="button"
            className="job-image-gallery-item"
            key={image.id || image.image}
            onClick={() => setActiveIndex(index)}
          >
            <img src={image.image} alt={`Job reference ${index + 1}`} />
            <span className="job-image-gallery-date">{formatUploadDate(image.uploadedAt)}</span>
          </button>
        ))}
      </div>

      {activeImage && (
        <div className="job-image-lightbox" role="dialog" aria-modal="true">
          <div className="job-image-lightbox-content">
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setActiveIndex(null)} />
            <img src={activeImage.image} alt="Job reference full size" />
            <p className="small text-muted mb-0">{formatUploadDate(activeImage.uploadedAt)}</p>
            <div className="job-image-lightbox-controls">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev))}
                disabled={activeIndex === 0}
              >
                Previous
              </button>
              <span className="small text-muted">
                {activeIndex + 1} of {sortedImages.length}
              </span>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setActiveIndex((prev) => (prev < sortedImages.length - 1 ? prev + 1 : prev))}
                disabled={activeIndex === sortedImages.length - 1}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}