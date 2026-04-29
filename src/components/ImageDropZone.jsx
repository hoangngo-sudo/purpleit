import { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * A drag-and-drop image upload zone with click-to-browse fallback.
 *
 * @param {object} props
 * @param {File|null}           props.file            Currently selected file
 * @param {(file:File)=>void}   props.onFileSelect    Called when a valid file is selected
 * @param {()=>void}            props.onFileClear     Called when the user removes the file
 * @param {(msg:string)=>void}  props.onError         Called with error message on invalid file
 * @param {string}              [props.currentImageUrl] Existing image URL to preview (edit page)
 * @param {number|null}        [props.progress]       Upload progress 0–100 (null = no upload in flight)
 * @param {string}              [props.accentColor]    Bootstrap color name (default: 'primary')
 */
const ImageDropZone = ({ file, onFileSelect, onFileClear, onError, currentImageUrl, progress, accentColor = 'primary' }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  const validate = (f) => {
    if (!f.type.startsWith('image/')) return 'Please select an image file';
    if (f.size > 50 * 1024 * 1024) return 'File size should be less than 50MB';
    return null;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    const err = validate(droppedFile);
    if (err) {
      if (onError) onError(err);
      return;
    }
    onFileSelect(droppedFile);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const err = validate(selected);
    if (err) {
      if (onError) onError(err);
      return;
    }
    onFileSelect(selected);
  };

  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const borderColor = isDragOver
    ? `border-${accentColor}`
    : file ? `border-success` : 'border-secondary-subtle';
  const bgClass = isDragOver ? `bg-${accentColor} bg-opacity-10` : '';

  return (
    <div>
      <motion.div
        className={`image-dropzone rounded-3 p-4 text-center position-relative ${borderColor} ${bgClass}`}
        style={{
          border: '2px dashed',
          cursor: 'pointer',
          minHeight: '160px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          willChange: 'transform',
        }}
        animate={shouldReduceMotion ? undefined : {
          scale: isDragOver ? 1.01 : 1,
        }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }
        }
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
        aria-label="Drop an image here or click to browse"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="d-none"
          tabIndex={-1}
        />

        {file ? (
          <div className="d-flex flex-column align-items-center gap-2">
            <img
              src={previewUrl}
              alt="Preview"
              className="rounded"
              style={{ maxHeight: '225px', maxWidth: '100%', objectFit: 'contain' }}
            />
            <small className="text-success fw-semibold">
              <i className="bi bi-check-circle me-1"></i>
              {file.name}
              <span className="text-muted ms-1">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
            </small>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={(e) => {
                e.stopPropagation();
                onFileClear();
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              Remove
            </button>
          </div>
        ) : currentImageUrl ? (
          <div className="d-flex flex-column align-items-center gap-3">
            <img
              src={currentImageUrl}
              alt="Current"
              className="rounded"
              style={{ maxHeight: '225px', maxWidth: '100%', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <small className="text-muted">
              Drop a new image or click to replace
            </small>
          </div>
        ) : (
          <div>
            <p className="mb-1 fw-semibold">
              Drag &amp; drop an image here
            </p>
            <p className="text-muted small mb-0">
              or click to browse &middot; PNG, JPG, GIF &middot; max 50 MB
            </p>
          </div>
        )}
      </motion.div>

      {progress != null && (
        <div className="mt-2">
          <div className="progress" role="progressbar" aria-label="Upload progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} style={{ height: '6px' }}>
            <div
              className="progress-bar progress-bar-striped progress-bar-animated"
              style={{ width: `${progress}%` }}
            />
          </div>
          <small className="text-muted mt-1 d-block text-center">{progress}% uploaded</small>
        </div>
      )}
    </div>
  );
};

export default ImageDropZone;
