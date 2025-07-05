import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Tesseract from 'tesseract.js';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import VariableProximity from '@/components/VariableProximity';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?worker&url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const LandingPage = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [hasProcessed, setHasProcessed] = useState(false); // Prevents auto-processing
  const navigate = useNavigate();
  const containerRef = React.useRef(null);

  useEffect(() => {
    setLoading(false);
    setProgress(0);
    setError('');
    setHasProcessed(false);
  }, []);

  const pdfToImages = async (file: File): Promise<string[]> => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const images: string[] = [];
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
      images.push(canvas.toDataURL('image/png'));
    }
    return images;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError('');
    if (acceptedFiles.length > 0) {
      setLoading(true);
      setProgress(0);
      setHasProcessed(true);
      const file = acceptedFiles[0];
      try {
        let ocrText = '';
        if (file.type === 'application/pdf') {
          const images = await pdfToImages(file);
          let allText = '';
          for (let i = 0; i < images.length; i++) {
            const { data: { text } } = await Tesseract.recognize(
              images[i],
              'eng',
              {
                logger: (m: { status: string; progress: number }) => {
                  if (m.status === 'recognizing text') {
                    setProgress(Math.round(((i + m.progress) / images.length) * 100));
                  }
                },
              }
            );
            allText += text + '\n';
          }
          ocrText = allText;
        } else {
        const { data: { text } } = await Tesseract.recognize(
            file,
          'eng',
          {
            logger: (m: { status: string; progress: number }) => {
              if (m.status === 'recognizing text') {
                setProgress(Math.round(m.progress * 100));
              }
            },
          }
        );
          ocrText = text;
        }
        navigate('/builder', { state: { ocrText } });
      } catch (err) {
        setError('Failed to process file. Please upload a clear image or PDF.');
        console.error('OCR Error:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'application/pdf': [],
    } 
  });

  return (
    <div className="mx-auto text-center py-24 max-w-3xl">
      {/* <h1 className="text-5xl font-serif mb-4">Apply smarter with<br/>AI-tailored resumes</h1> */}
      <div
        ref={containerRef}
        style={{position: 'relative'}}
        >
        <VariableProximity
          label={'Apply smarter with AI-tailored resumes'}
          className="text-5xl md:text-7xl italic leading-tight text-gray-900"
          fromFontVariationSettings="'wght' 400, 'opsz' 9"
          toFontVariationSettings="'wght' 900, 'opsz' 40"
          containerRef={containerRef}
          radius={100}
          falloff="exponential"
          style={{ fontFamily: "'Savate', sans-serif" }}
        />
      </div>
      <p className="text-muted-foreground text-xl mb-12 mt-6">Upload your resume, job description and get tailored resume</p>
      
      <div
        {...getRootProps()}
        className={`mx-auto max-w-lg border-2 border-dashed rounded-xl p-12 cursor-pointer bg-white
          ${isDragActive ? 'border-primary bg-muted' : 'border-border'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <img src="/assets/icon-upload_resume.png" alt="Upload resume" className="w-48 h-48 text-muted-foreground" />
          <p className="font-semibold">Drag & drop resume here</p>
          <p className="text-sm text-muted-foreground">
            We never share your data with third parties or use them to train our models of the
          </p>
          <Button variant="outline" type="button">Browse files</Button>
        </div>
      </div>

      {loading && hasProcessed && (
        <div className="mt-8">
          <p>Processing your resume... {progress}%</p>
        </div>
      )}
      {error && (
        <div className="mt-8 text-red-500">{error}</div>
      )}
    </div>
  );
};

export default LandingPage; 