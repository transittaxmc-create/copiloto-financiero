'use client';

import { useState, useCallback } from 'react';
import { Camera, FileText, Loader2, Upload, X } from 'lucide-react';
import type { EZPassSource } from '@/lib/ezpass-types';

interface Props {
  onClose: () => void;
  onUpload: (file: File, source: EZPassSource) => Promise<void>;
}

export default function UploadModal({ onClose, onUpload }: Props) {
  const [selectedSource, setSelectedSource] = useState<EZPassSource>('screenshot');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    setUploading(true);
    setProgress('Procesando imagen...');
    try {
      await onUpload(file, selectedSource);
      onClose();
    } catch (error) {
      console.error('Error uploading:', error);
      setProgress('Error al procesar');
    } finally {
      setUploading(false);
    }
  };

  const sources: { value: EZPassSource; label: string; icon: string }[] = [
    { value: 'screenshot', label: 'Screenshot', icon: '📷' },
    { value: 'ezpass_statement', label: 'E-ZPass Statement', icon: '🧾' },
    { value: 'company_invoice', label: 'Factura Compañía', icon: '🏢' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700/50">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Camera size={18} className="text-sky-400" />
            Subir Evidencia
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Selector de fuente */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">Tipo de documento</label>
            <div className="grid grid-cols-3 gap-2">
              {sources.map((source) => (
                <button
                  key={source.value}
                  onClick={() => setSelectedSource(source.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs transition-all ${
                    selectedSource === source.value
                      ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300'
                      : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg">{source.icon}</span>
                  <span className="text-[10px]">{source.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Zona de upload */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              dragActive
                ? 'border-sky-500 bg-sky-500/10'
                : 'border-slate-600 hover:border-slate-500'
            }`}
          >
            {uploading ? (
              <div className="space-y-2">
                <Loader2 size={24} className="text-sky-400 animate-spin mx-auto" />
                <p className="text-sm text-slate-300">{progress}</p>
              </div>
            ) : (
              <>
                <Upload size={24} className="text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-300">
                  Arrastra una imagen o <span className="text-sky-400">selecciona archivo</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </>
            )}
          </div>

          {/* Info OCR */}
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <FileText size={12} className="text-sky-400" />
              El sistema extraerá automáticamente fecha, hora y monto usando OCR
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}