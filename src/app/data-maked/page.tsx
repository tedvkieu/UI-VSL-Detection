'use client';

import React from 'react';
import Webcam from 'react-webcam';

export default function SimpleWebcam() {
  return (
    <div className="flex justify-center items-center h-screen">
      <Webcam
        audio={false}
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: 'user', // Camera trước
        }}
        className="rounded-lg border-4 border-blue-400"
      />
    </div>
  );
}
