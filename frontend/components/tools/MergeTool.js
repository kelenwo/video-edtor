'use client';

export default function MergeTool({ onMerge }) {
  return (
    <div>
      <h3>Merge</h3>
      <button onClick={onMerge}>Merge Videos</button>
    </div>
  );
} 