import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, File, Image, Video, Music, FileText, Download, Eye, Trash2 } from 'lucide-react';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  url?: string;
  preview?: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface SmartFileUploadProps {
  value?: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  onUpload?: (file: File) => Promise<{ url: string; id?: string }>;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  
  // File restrictions
  accept?: string;
  maxSize?: number; // in bytes
  maxFiles?: number;
  allowedTypes?: string[];
  
  // UI options
  multiple?: boolean;
  showPreview?: boolean;
  showProgress?: boolean;
  dragAndDrop?: boolean;
  
  // Upload options
  autoUpload?: boolean;
  uploadEndpoint?: string;
  
  // Events
  onFileAdd?: (file: File) => void;
  onFileRemove?: (fileId: string) => void;
  onUploadStart?: (file: File) => void;
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (file: File, error: string) => void;
}

const SmartFileUpload: React.FC<SmartFileUploadProps> = ({
  value = [],
  onChange,
  onUpload,
  label,
  error,
  disabled = false,
  required = false,
  className = '',
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 10,
  allowedTypes,
  multiple = true,
  showPreview = true,
  showProgress = true,
  dragAndDrop = true,
  autoUpload = true,
  uploadEndpoint,
  onFileAdd,
  onFileRemove,
  onUploadStart,
  onUploadComplete,
  onUploadError
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadedFile[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Get file icon based on type
  const getFileIcon = useCallback((type: string) => {
    if (type.startsWith('image/')) return <Image className="w-6 h-6" />;
    if (type.startsWith('video/')) return <Video className="w-6 h-6" />;
    if (type.startsWith('audio/')) return <Music className="w-6 h-6" />;
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) {
      return <FileText className="w-6 h-6" />;
    }
    return <File className="w-6 h-6" />;
  }, []);
  
  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);
  
  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size must be less than ${formatFileSize(maxSize)}`;
    }
    
    // Check file type
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed`;
    }
    
    // Check accept attribute
    if (accept) {
      const acceptTypes = accept.split(',').map(type => type.trim());
      const isAccepted = acceptTypes.some(acceptType => {
        if (acceptType.startsWith('.')) {
          return file.name.toLowerCase().endsWith(acceptType.toLowerCase());
        }
        if (acceptType.includes('*')) {
          const baseType = acceptType.split('/')[0];
          return file.type.startsWith(baseType);
        }
        return file.type === acceptType;
      });
      
      if (!isAccepted) {
        return `File type not accepted. Allowed: ${accept}`;
      }
    }
    
    return null;
  }, [maxSize, allowedTypes, accept, formatFileSize]);
  
  // Create file preview
  const createPreview = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (!showPreview || !file.type.startsWith('image/')) {
        resolve(undefined);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(file);
    });
  }, [showPreview]);
  
  // Upload file
  const uploadFile = useCallback(async (uploadedFile: UploadedFile) => {
    if (!onUpload && !uploadEndpoint) return;
    
    // Update status to uploading
    const updatedFiles = value.map(f => 
      f.id === uploadedFile.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
    );
    onChange(updatedFiles);
    
    if (onUploadStart) {
      onUploadStart(uploadedFile.file);
    }
    
    try {
      let result: { url: string; id?: string };
      
      if (onUpload) {
        result = await onUpload(uploadedFile.file);
      } else if (uploadEndpoint) {
        // Default upload implementation
        const formData = new FormData();
        formData.append('file', uploadedFile.file);
        
        const response = await fetch(uploadEndpoint, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        result = await response.json();
      } else {
        throw new Error('No upload method provided');
      }
      
      // Update file with upload result
      const completedFile: UploadedFile = {
        ...uploadedFile,
        url: result.url,
        id: result.id || uploadedFile.id,
        status: 'completed',
        progress: 100
      };
      
      const finalFiles = value.map(f => 
        f.id === uploadedFile.id ? completedFile : f
      );
      onChange(finalFiles);
      
      if (onUploadComplete) {
        onUploadComplete(completedFile);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      // Update file with error
      const errorFiles = value.map(f => 
        f.id === uploadedFile.id ? { ...f, status: 'error' as const, error: errorMessage } : f
      );
      onChange(errorFiles);
      
      if (onUploadError) {
        onUploadError(uploadedFile.file, errorMessage);
      }
    }
  }, [value, onChange, onUpload, uploadEndpoint, onUploadStart, onUploadComplete, onUploadError]);
  
  // Add files
  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Check max files limit
    if (value.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }
    
    const newFiles: UploadedFile[] = [];
    
    for (const file of fileArray) {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        alert(`${file.name}: ${validationError}`);
        continue;
      }
      
      // Create preview
      const preview = await createPreview(file);
      
      const uploadedFile: UploadedFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview,
        status: 'pending',
        progress: 0
      };
      
      newFiles.push(uploadedFile);
      
      if (onFileAdd) {
        onFileAdd(file);
      }
    }
    
    const updatedFiles = [...value, ...newFiles];
    onChange(updatedFiles);
    
    // Auto upload if enabled
    if (autoUpload) {
      newFiles.forEach(file => {
        uploadFile(file);
      });
    }
  }, [value, maxFiles, validateFile, createPreview, onChange, onFileAdd, autoUpload, uploadFile]);
  
  // Remove file
  const removeFile = useCallback((fileId: string) => {
    const updatedFiles = value.filter(f => f.id !== fileId);
    onChange(updatedFiles);
    
    if (onFileRemove) {
      onFileRemove(fileId);
    }
  }, [value, onChange, onFileRemove]);
  
  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
    
    // Reset input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addFiles]);
  
  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && dragAndDrop) {
      setIsDragOver(true);
    }
  }, [disabled, dragAndDrop]);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled || !dragAndDrop) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
  }, [disabled, dragAndDrop, addFiles]);
  
  // Open file dialog
  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);
  
  // Download file
  const downloadFile = useCallback((file: UploadedFile) => {
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);
  
  // Preview file
  const previewFile = useCallback((file: UploadedFile) => {
    if (file.url || file.preview) {
      window.open(file.url || file.preview, '_blank');
    }
  }, []);
  
  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${isDragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'}
          ${error ? 'border-red-500' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />
        
        <div className="space-y-2">
          <Upload className="w-8 h-8 text-gray-400 mx-auto" />
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {dragAndDrop ? (
              <>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  Click to upload
                </span>
                {' or drag and drop'}
              </>
            ) : (
              <span className="font-medium text-blue-600 dark:text-blue-400">
                Click to upload
              </span>
            )}
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {accept && <div>Accepted: {accept}</div>}
            <div>Max size: {formatFileSize(maxSize)}</div>
            {maxFiles > 1 && <div>Max files: {maxFiles}</div>}
          </div>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-500 flex items-center space-x-1">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}
      
      {/* File List */}
      {value.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Files ({value.length})
          </h4>
          
          <div className="space-y-2">
            {value.map((file) => (
              <div
                key={file.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                {/* File Icon/Preview */}
                <div className="flex-shrink-0">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                </div>
                
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                    
                    {file.status === 'completed' && file.url && (
                      <span className="ml-2 text-green-600 dark:text-green-400">✓ Uploaded</span>
                    )}
                    
                    {file.status === 'error' && (
                      <span className="ml-2 text-red-600 dark:text-red-400">✗ {file.error}</span>
                    )}
                    
                    {file.status === 'uploading' && (
                      <span className="ml-2 text-blue-600 dark:text-blue-400">Uploading...</span>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  {showProgress && file.status === 'uploading' && (
                    <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress || 0}%` }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-1">
                  {(file.url || file.preview) && (
                    <button
                      type="button"
                      onClick={() => previewFile(file)}
                      className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  
                  {file.url && (
                    <button
                      type="button"
                      onClick={() => downloadFile(file)}
                      className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Upload All Button */}
      {!autoUpload && value.some(f => f.status === 'pending') && (
        <button
          type="button"
          onClick={() => {
            value.filter(f => f.status === 'pending').forEach(uploadFile);
          }}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Upload All Files
        </button>
      )}
    </div>
  );
};

export default SmartFileUpload;
export type { UploadedFile, SmartFileUploadProps };