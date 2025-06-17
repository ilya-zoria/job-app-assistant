import { useEffect, useRef } from 'react';

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let width: number, height: number, imageData: ImageData, data: Uint8ClampedArray;
    const SCALE = 2; // Render at half resolution for performance
    
    function resizeCanvas() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      width = Math.floor(canvas.width / SCALE);
      height = Math.floor(canvas.height / SCALE);
      imageData = ctx.createImageData(width, height);
      data = imageData.data;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    let startTime = Date.now();
    
    // Pre-compute sine/cosine tables for better performance
    const SIN_TABLE = new Float32Array(1024);
    const COS_TABLE = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const angle = (i / 1024) * Math.PI * 2;
      SIN_TABLE[i] = Math.sin(angle);
      COS_TABLE[i] = Math.cos(angle);
    }
    
    function fastSin(x: number) {
      const index = Math.floor(((x % (Math.PI * 2)) / (Math.PI * 2)) * 1024) & 1023;
      return SIN_TABLE[index];
    }
    
    function fastCos(x: number) {
      const index = Math.floor(((x % (Math.PI * 2)) / (Math.PI * 2)) * 1024) & 1023;
      return COS_TABLE[index];
    }
    
    function render() {
      if (!canvas || !ctx) return;
      
      const time = (Date.now() - startTime) * 0.001;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Simplified coordinate normalization
          const u_x = (2 * x - width) / height;
          const u_y = (2 * y - height) / height;
          
          // Reduced iterations and simplified calculations
          let a = 0;
          let d = 0;
          
          for (let i = 0; i < 4; i++) { // Reduced from 8 to 4 iterations
            a += fastCos(i - d + time * 0.5 - a * u_x);
            d += fastSin(i * u_y + a);
          }
          
          // Apple-inspired color palette: whites, grays, and subtle blue
          const wave = (fastSin(a) + fastCos(d)) * 0.5;
          const intensity = 0.8 + 0.2 * wave;
          
          // Base gray with subtle variations
          const baseGray = 0.9 + 0.1 * fastCos(u_x + u_y + time);
          
          // Apple blue accent (subtle)
          const blueAccent = 0.02 * fastSin(a * 2 + d);
          
          // Clean, minimal color scheme
          const r = Math.max(0, Math.min(1, baseGray + blueAccent * 0.5)) * intensity;
          const g = Math.max(0, Math.min(1, baseGray + blueAccent * 0.7)) * intensity;
          const b = Math.max(0, Math.min(1, baseGray + blueAccent * 1.2)) * intensity;
          
          const finalR = r * 255;
          const finalG = g * 255;
          const finalB = b * 255;
          
          const index = (y * width + x) * 4;
          data[index] = finalR;
          data[index + 1] = finalG;
          data[index + 2] = finalB;
          data[index + 3] = 255;
        }
      }
      
      // Scale up the smaller image to full canvas size
      ctx.putImageData(imageData, 0, 0);
      if (SCALE > 1) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(canvas, 0, 0, width, height, 0, 0, canvas.width, canvas.height);
      }
      
      requestAnimationFrame(render);
    }
    
    const animationFrame = requestAnimationFrame(render);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full fixed top-0 left-0 -z-10"
    />
  );
} 