import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import { landmarkUtils } from '../../utils/landmarkUtils';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { HandLandmarker } from '@mediapipe/tasks-vision';

interface LandmarkOverlayProps {
  landmarks: NormalizedLandmark[] | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  className?: string;
}

export const LandmarkOverlay: React.FC<LandmarkOverlayProps> = ({
  landmarks,
  videoRef,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    // Update canvas size to match video
    const updateCanvasSize = () => {
      canvas.width = video.offsetWidth;
      canvas.height = video.offsetHeight;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [videoRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || landmarks.length === 0) return;

    const videoWidth = canvas.width;
    const videoHeight = canvas.height;

    // Draw connections (lines)
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.55)';
    ctx.lineWidth = 1.5;

    const connections = HandLandmarker.HAND_CONNECTIONS;
    connections.forEach(({ start, end }) => {
      const startLm = landmarks[start];
      const endLm = landmarks[end];

      if (!startLm || !endLm) return;

      ctx.beginPath();
      ctx.moveTo(startLm.x * videoWidth, startLm.y * videoHeight);
      ctx.lineTo(endLm.x * videoWidth, endLm.y * videoHeight);
      ctx.stroke();
    });

    // Draw landmark dots
    landmarks.forEach((lm) => {
      if (!lm) return;

      ctx.beginPath();
      ctx.arc(lm.x * videoWidth, lm.y * videoHeight, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#4ADE80';
      ctx.shadowColor = '#4ADE80';
      ctx.shadowBlur = 6;
      ctx.fill();
    });

    ctx.shadowBlur = 0;
  }, [landmarks, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        'absolute inset-0 pointer-events-none',
        className
      )}
    />
  );
};
