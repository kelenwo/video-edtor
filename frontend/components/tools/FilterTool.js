'use client';

import { useState } from 'react';

export default function FilterTool({ onAddFilterClip }) {
  const [selectedFilter, setSelectedFilter] = useState('');

  return (
    <div>
      <h3>Filters</h3>
      <select onChange={(e) => setSelectedFilter(e.target.value)} value={selectedFilter}>
        <option value="">Select a filter</option>
        <option value="grayscale">Grayscale</option>
        <option value="sepia">Sepia</option>
      </select>
      <button onClick={() => onAddFilterClip(selectedFilter)}>Add Filter Clip</button>
    </div>
  );
} 