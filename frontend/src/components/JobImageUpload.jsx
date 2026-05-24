import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_MAX_IMAGES = 5;
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function JobImageUpload({ maxImages = DEFAULT_MAX_IMAGES, maxFileSize = DEFAULT_MAX_FILE_SIZE, onImagesChange }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const previewUrlsRef = useRef(new Set());

  const remainingSlots = maxImages - items.length;
  const hasItems = items.length > 0;

  const emitChange = useCallback(
    (nextItems) => {
      setItems(nextItems);
      if (onImagesChange) {
        onImagesChange(nextItems.map((item) => item.file));
      }
    },
    [onImagesChange],
  );

  const validateFiles = useCallback(
    (files) => {
      const errors = [];
      const validFiles = [];
      Array.from(files).forEach((file) => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          errors.push(`${file.name}: unsupported format.`);
          return;
        }
        if (file.size > maxFileSize) {
          errors.push(`${file.name}: exceeds ${formatFileSize(maxFileSize)}.`);
          return;
        }
        validFiles.push(file);
      });
      return { errors, validFiles };
    },
    [maxFileSize],
  );

  const handleFiles = useCallback(
    (fileList) => {
      if (!fileList || fileList.length === 0) {
        return;
      }
      const { errors, validFiles } = validateFiles(fileList);
      if (items.length + validFiles.length > maxImages) {
        errors.push(`You can only upload up to ${maxImages} images.`);
      }
      setError(errors.join(" "));
      if (validFiles.length === 0) {
        return;
      }
      const allowedFiles = validFiles.slice(0, Math.max(0, maxImages - items.length));
      const newItems = allowedFiles.map((file) => {
        const preview = URL.createObjectURL(file);
        previewUrlsRef.current.add(preview);
        return {
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
          file,
          preview,
        };
      });
      emitChange([...items, ...newItems]);
    },
    [emitChange, items, maxImages, validateFiles],
  );

  const handleFileInput = (event) => {
    handleFiles(event.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleRemove = (id) => {
    const removedItem = items.find((item) => item.id === id);
    if (removedItem?.preview) {
      URL.revokeObjectURL(removedItem.preview);
      previewUrlsRef.current.delete(removedItem.preview);
    }
    const nextItems = items.filter((item) => item.id !== id);
    emitChange(nextItems);
  };

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((preview) => URL.revokeObjectURL(preview));
      previewUrlsRef.current.clear();
    };
  }, []);

  const moveItem = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= items.length) {
      return;
    }
    const nextItems = [...items];
    const [moved] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, moved);
    emitChange(nextItems);
  };

  const helperText = useMemo(() => {
    if (!hasItems) {
      return `Add up to ${maxImages} images (JPG, PNG, WebP). Max ${formatFileSize(maxFileSize)} each.`;
    }
    return `${items.length} of ${maxImages} images selected.`;
  }, [hasItems, items.length, maxImages, maxFileSize]);

  return (
    <div className="job-image-upload">
      <div
        className={`job-image-dropzone ${hasItems ? "has-items" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div>
          <p className="fw-semibold mb-1">Drag & drop images here</p>
          <p className="text-muted small mb-2">or click to browse</p>
          <button
            className="btn btn-outline-primary btn-sm"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={remainingSlots <= 0}
          >
            Select Images
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={handleFileInput}
          />
        </div>
      </div>
      <p className="form-text mb-2">{helperText}</p>
      {error && <div className="alert alert-warning py-2">{error}</div>}
      {hasItems && (
        <div className="row g-2">
          {items.map((item, index) => (
            <div className="col-6 col-md-4" key={item.id}>
              <div className="job-image-preview-card">
                <img src={item.preview} alt={item.file.name} />
                <div className="job-image-preview-meta">
                  <span className="small text-muted">{formatFileSize(item.file.size)}</span>
                  <div className="job-image-preview-actions">
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={() => moveItem(index, index - 1)}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={() => moveItem(index, index + 1)}
                      disabled={index === items.length - 1}
                    >
                      ↓
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemove(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
