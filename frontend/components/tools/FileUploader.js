'use client';

export default function FileUploader({ onFileSelect }) {
  return (
    <div className="mb-3">
      <label htmlFor="formFileMultiple" className="form-label">Upload Video(s)</label>
      <input className="form-control" type="file" id="formFileMultiple" onChange={onFileSelect} multiple />
    </div>
  );
} 