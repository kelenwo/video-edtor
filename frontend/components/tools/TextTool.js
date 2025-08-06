'use client';

import { useState } from 'react';

export default function TextTool({ onAddTextClip }) {
  const [overlayText, setOverlayText] = useState('');
  const [fontSize, setFontSize] = useState(24);
  const [fontColor, setFontColor] = useState('#ffffff');

  const handleAddClip = () => {
    onAddTextClip({
      text: overlayText,
      fontSize: fontSize,
      fontColor: fontColor,
    });
  };

  return (
    <div>
      <h3>Text Overlay</h3>
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          value={overlayText}
          onChange={(e) => setOverlayText(e.target.value)}
          placeholder="Enter text"
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Font Size</label>
        <input
          type="number"
          className="form-control"
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Font Color</label>
        <input
          type="color"
          className="form-control form-control-color"
          value={fontColor}
          onChange={(e) => setFontColor(e.target.value)}
        />
      </div>
      <button className="btn btn-primary" type="button" onClick={handleAddClip}>Add Text Clip</button>
    </div>
  );
} 