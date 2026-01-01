
import React, { useRef, useEffect, useState } from 'react';

interface CameraViewProps {
  onFrame: (base64Frame: string) => void;
  isActive: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ onFrame, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let interval: number | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Start frame capture loop
        interval = window.setInterval(() => {
          if (videoRef.current && canvasRef.current && isActive) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (ctx && video.videoWidth > 0) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
              onFrame(base64);
            }
          }
        }, 1500); // 1.5 seconds per frame is sufficient for civil engineering context
      } catch (err) {
        setError("Camera access denied or unavailable.");
        console.error(err);
      }
    };

    if (isActive) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, onFrame]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden rounded-2xl border-4 border-slate-800 shadow-2xl">
      {error ? (
        <div className="flex items-center justify-center h-full text-white p-6 text-center">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 pointer-events-none border-[1px] border-amber-400/30">
            {/* Viewfinder elements */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-amber-400"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-amber-400"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-amber-400"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-amber-400"></div>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraView;
