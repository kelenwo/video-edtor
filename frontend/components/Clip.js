'use client';

import { Rnd } from 'react-rnd';

export default function Clip({ title, color, width, onResize }) {
  const style = {
    backgroundColor: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    borderRadius: '8px',
  };

  return (
    <Rnd
      style={style}
      size={{ width: width, height: '48px' }} // Adjusted height for Bootstrap layout
      onResizeStop={(e, direction, ref, delta, position) => {
        onResize(delta.width);
      }}
      disableDragging={true}
      enableResizing={{
        top: false,
        right: true,
        bottom: false,
        left: true,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
      className="m-2"
    >
      {title}
    </Rnd>
  );
} 