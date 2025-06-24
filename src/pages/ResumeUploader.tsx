import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Tesseract from 'tesseract.js';
import { useNavigate } from 'react-router-dom';
import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?worker&url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const ResumeUploader = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [hasProcessed, setHasProcessed] = useState(false); // Prevents auto-processing
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(false);
    setProgress(0);
    setError('');
    setHasProcessed(false);
  }, []);

  const pdfToImage = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1); // Only first page for now
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
      return canvas.toDataURL('image/png');
    } catch (err) {
      throw new Error('Failed to render PDF to image.');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError('');
    if (acceptedFiles.length > 0) {
      setLoading(true);
      setProgress(0);
      setHasProcessed(true);
      const file = acceptedFiles[0];
      try {
        let imageSource: string | File = file;
        if (file.type === 'application/pdf') {
          imageSource = await pdfToImage(file);
        }
        const { data: { text } } = await Tesseract.recognize(
          imageSource,
          'eng',
          {
            logger: (m: { status: string; progress: number }) => {
              if (m.status === 'recognizing text') {
                setProgress(Math.round(m.progress * 100));
              }
            },
          }
        );
        navigate('/builder', { state: { ocrText: text } });
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
    <div className="container mx-auto text-center py-24">
      <h1 className="text-5xl font-serif mb-4">Apply smarter with<br/>AI-tailored resumes</h1>
      <p className="text-muted-foreground mb-12">Upload your resume, job description and get tailored resume</p>
      
      <div
        {...getRootProps()}
        className={`mx-auto max-w-lg border-2 border-dashed rounded-xl p-12 cursor-pointer
          ${isDragActive ? 'border-primary bg-muted' : 'border-border'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <UploadCloud className="w-16 h-16 text-muted-foreground" />
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

export default ResumeUploader; 