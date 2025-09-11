import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Upload, X, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  uploading: boolean;
  error?: string;
}

interface ImageUploadDropzoneProps {
  onImagesChange: (images: UploadedImage[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  initialImages?: UploadedImage[];
}

const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  onImagesChange,
  maxFiles = 10,
  maxFileSize = 5,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  initialImages = []
}) => {
  const { isDark } = useTheme();
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>('');

  // Update images when initialImages prop changes
  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use: ${acceptedTypes.join(', ')}`;
    }
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }
    return null;
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const currentImageCount = images.length;
    
    if (currentImageCount + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`);
      return;
    }

    setError('');
    const newImages: UploadedImage[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const preview = URL.createObjectURL(file);
      
      const newImage: UploadedImage = {
        id,
        file,
        preview,
        uploading: true
      };
      
      newImages.push(newImage);
    }

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange(updatedImages);

      // Simulate upload process
      setTimeout(() => {
        setImages(prev => {
          const updated = prev.map(img => 
            newImages.find(ni => ni.id === img.id) 
              ? { ...img, uploading: false }
              : img
          );
          onImagesChange(updated);
          return updated;
        });
      }, 1500);
    }
  }, [images, maxFiles, maxFileSize, acceptedTypes, onImagesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      const updated = prev.filter(img => img.id !== id);
      onImagesChange(updated);
      return updated;
    });
  }, [onImagesChange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Dropzone Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? (isDark ? 'border-blue-400 bg-blue-900/20' : 'border-blue-400 bg-blue-50')
            : (isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400')
          }
          ${isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'}
        `}
        role="button"
        tabIndex={0}
        aria-label="Upload images by clicking or dragging files here"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className={`p-4 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
            <Upload className={`h-8 w-8 ${isDark ? 'text-gray-300' : 'text-gray-500'}`} />
          </div>
          
          <div>
            <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Drop images here or click to browse
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              Support for JPG, PNG, GIF, WebP up to {maxFileSize}MB each
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
              Maximum {maxFiles} images ({images.length}/{maxFiles})
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`flex items-center space-x-2 p-3 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</span>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Selected Images ({images.length})
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative group rounded-lg overflow-hidden border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'} shadow-sm`}
              >
                {/* Image Preview */}
                <div className="aspect-square relative">
                  <img
                    src={image.preview}
                    alt={image.file.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Upload Overlay */}
                  {image.uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                  
                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(image.id);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                    aria-label={`Remove ${image.file.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                
                {/* File Info */}
                <div className="p-2">
                  <p className={`text-xs font-medium truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {image.file.name}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatFileSize(image.file.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadDropzone;