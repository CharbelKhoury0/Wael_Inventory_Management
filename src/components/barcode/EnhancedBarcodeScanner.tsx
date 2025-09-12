import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Zap, ZapOff, RotateCcw, Settings, Check, AlertCircle } from 'lucide-react';

interface BarcodeResult {
  text: string;
  format: string;
  timestamp: Date;
  confidence?: number;
}

interface EnhancedBarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: BarcodeResult) => void;
  onError?: (error: string) => void;
  
  // Scanner options
  formats?: string[]; // Supported barcode formats
  continuous?: boolean; // Continuous scanning
  beepOnScan?: boolean;
  vibrationOnScan?: boolean;
  
  // Camera options
  preferredCamera?: 'front' | 'back';
  resolution?: 'low' | 'medium' | 'high';
  
  // UI options
  showSettings?: boolean;
  showHistory?: boolean;
  overlayColor?: string;
  
  // Validation
  validateBarcode?: (text: string) => boolean;
  expectedFormat?: string;
}

interface ScanHistory {
  id: string;
  result: BarcodeResult;
  isValid: boolean;
}

const SUPPORTED_FORMATS = [
  'CODE128',
  'CODE39',
  'EAN13',
  'EAN8',
  'UPC_A',
  'UPC_E',
  'QR_CODE',
  'DATA_MATRIX',
  'PDF417',
  'AZTEC',
  'CODABAR',
  'ITF',
  'RSS14',
  'RSS_EXPANDED'
];

const EnhancedBarcodeScanner: React.FC<EnhancedBarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScan,
  onError,
  formats = ['CODE128', 'EAN13', 'QR_CODE'],
  continuous = false,
  beepOnScan = true,
  vibrationOnScan = true,
  preferredCamera = 'back',
  resolution = 'medium',
  showSettings = true,
  showHistory = true,
  overlayColor = '#00ff00',
  validateBarcode,
  expectedFormat
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentCamera, setCurrentCamera] = useState(preferredCamera);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState(formats);
  const [scanCount, setScanCount] = useState(0);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: currentCamera === 'back' ? 'environment' : 'user',
          width: resolution === 'high' ? 1920 : resolution === 'medium' ? 1280 : 640,
          height: resolution === 'high' ? 1080 : resolution === 'medium' ? 720 : 480
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        
        // Start scanning when video is ready
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            setIsScanning(true);
            startScanning();
          }
        };
      }
    } catch (error) {
      console.error('Camera initialization error:', error);
      setHasPermission(false);
      if (onError) {
        onError('Camera access denied or not available');
      }
    }
  }, [currentCamera, resolution, onError]);
  
  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setIsScanning(false);
  }, []);
  
  // Toggle flash
  const toggleFlash = useCallback(async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && 'torch' in track.getCapabilities()) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !flashEnabled } as any]
          });
          setFlashEnabled(!flashEnabled);
        } catch (error) {
          console.error('Flash toggle error:', error);
        }
      }
    }
  }, [flashEnabled]);
  
  // Switch camera
  const switchCamera = useCallback(() => {
    const newCamera = currentCamera === 'back' ? 'front' : 'back';
    setCurrentCamera(newCamera);
    
    // Restart camera with new facing mode
    stopCamera();
    setTimeout(() => {
      initializeCamera();
    }, 100);
  }, [currentCamera, stopCamera, initializeCamera]);
  
  // Play beep sound
  const playBeep = useCallback(() => {
    if (!beepOnScan) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.1);
    } catch (error) {
      console.error('Beep sound error:', error);
    }
  }, [beepOnScan]);
  
  // Trigger vibration
  const triggerVibration = useCallback(() => {
    if (vibrationOnScan && 'vibrate' in navigator) {
      navigator.vibrate(100);
    }
  }, [vibrationOnScan]);
  
  // Simulate barcode detection (in a real implementation, you'd use a library like ZXing or QuaggaJS)
  const detectBarcode = useCallback((): BarcodeResult | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // In a real implementation, you would:
    // 1. Get image data from canvas
    // 2. Process it with a barcode detection library
    // 3. Return the detected barcode result
    
    // For demo purposes, we'll simulate detection occasionally
    if (Math.random() < 0.1) { // 10% chance per scan
      const mockBarcodes = [
        { text: '1234567890123', format: 'EAN13' },
        { text: 'ABC123DEF456', format: 'CODE128' },
        { text: 'https://example.com', format: 'QR_CODE' }
      ];
      
      const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
      
      return {
        ...randomBarcode,
        timestamp: new Date(),
        confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
      };
    }
    
    return null;
  }, []);
  
  // Start scanning process
  const startScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    scanIntervalRef.current = setInterval(() => {
      const result = detectBarcode();
      
      if (result) {
        // Validate barcode if validator is provided
        const isValid = validateBarcode ? validateBarcode(result.text) : true;
        
        // Check expected format
        const formatMatches = expectedFormat ? result.format === expectedFormat : true;
        
        if (isValid && formatMatches) {
          // Add to history
          const historyItem: ScanHistory = {
            id: `scan_${Date.now()}`,
            result,
            isValid: true
          };
          
          setScanHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep last 10
          setScanCount(prev => prev + 1);
          setLastScanTime(new Date());
          
          // Trigger feedback
          playBeep();
          triggerVibration();
          
          // Call onScan callback
          onScan(result);
          
          // Stop scanning if not continuous
          if (!continuous) {
            setIsScanning(false);
            if (scanIntervalRef.current) {
              clearInterval(scanIntervalRef.current);
              scanIntervalRef.current = null;
            }
          }
        } else {
          // Invalid barcode
          const historyItem: ScanHistory = {
            id: `scan_${Date.now()}`,
            result,
            isValid: false
          };
          
          setScanHistory(prev => [historyItem, ...prev.slice(0, 9)]);
        }
      }
    }, 100); // Scan every 100ms
  }, [detectBarcode, validateBarcode, expectedFormat, playBeep, triggerVibration, onScan, continuous]);
  
  // Initialize when scanner opens
  useEffect(() => {
    if (isOpen) {
      initializeCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen, initializeCamera, stopCamera]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopCamera]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">Barcode Scanner</h2>
            
            {scanCount > 0 && (
              <div className="text-sm opacity-75">
                Scanned: {scanCount}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Flash Toggle */}
            <button
              onClick={toggleFlash}
              className={`p-2 rounded-full transition-colors ${
                flashEnabled ? 'bg-yellow-500' : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              {flashEnabled ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
            </button>
            
            {/* Camera Switch */}
            <button
              onClick={switchCamera}
              className="p-2 bg-gray-600 hover:bg-gray-500 rounded-full transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            
            {/* Settings */}
            {showSettings && (
              <button
                onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                className="p-2 bg-gray-600 hover:bg-gray-500 rounded-full transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            
            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 bg-red-600 hover:bg-red-500 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Camera View */}
      <div className="relative w-full h-full">
        {hasPermission === null && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Requesting camera permission...</p>
            </div>
          </div>
        )}
        
        {hasPermission === false && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="mb-2">Camera access denied</p>
              <p className="text-sm opacity-75">Please enable camera permissions to scan barcodes</p>
            </div>
          </div>
        )}
        
        {hasPermission && (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Scanning Frame */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="w-64 h-64 border-2 border-dashed rounded-lg"
                  style={{ borderColor: overlayColor }}
                >
                  {/* Corner indicators */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4" style={{ borderColor: overlayColor }} />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4" style={{ borderColor: overlayColor }} />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4" style={{ borderColor: overlayColor }} />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4" style={{ borderColor: overlayColor }} />
                  
                  {/* Scanning line animation */}
                  {isScanning && (
                    <div 
                      className="absolute left-0 right-0 h-0.5 animate-pulse"
                      style={{ 
                        backgroundColor: overlayColor,
                        top: '50%',
                        animation: 'scan-line 2s ease-in-out infinite'
                      }}
                    />
                  )}
                </div>
              </div>
              
              {/* Instructions */}
              <div className="absolute bottom-20 left-0 right-0 text-center text-white">
                <p className="text-lg mb-2">
                  {isScanning ? 'Scanning for barcodes...' : 'Position barcode within the frame'}
                </p>
                
                {expectedFormat && (
                  <p className="text-sm opacity-75">
                    Expected format: {expectedFormat}
                  </p>
                )}
                
                {lastScanTime && (
                  <p className="text-sm opacity-75">
                    Last scan: {lastScanTime.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Settings Panel */}
      {showSettingsPanel && (
        <div className="absolute top-16 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-20">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Scanner Settings
          </h3>
          
          <div className="space-y-4">
            {/* Supported Formats */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Supported Formats
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_FORMATS.map(format => (
                  <label key={format} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedFormats.includes(format)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFormats(prev => [...prev, format]);
                        } else {
                          setSelectedFormats(prev => prev.filter(f => f !== format));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {format}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Scanning Mode */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={continuous}
                  onChange={(e) => {
                    // Note: This would need to be passed up to parent component
                    console.log('Continuous mode:', e.target.checked);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Continuous Scanning
                </span>
              </label>
            </div>
            
            {/* Audio Feedback */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={beepOnScan}
                  onChange={(e) => {
                    // Note: This would need to be passed up to parent component
                    console.log('Beep on scan:', e.target.checked);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Beep on Scan
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
      
      {/* Scan History */}
      {showHistory && scanHistory.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 max-h-40 overflow-y-auto bg-black bg-opacity-50 rounded-lg p-3">
          <h4 className="text-white text-sm font-medium mb-2">Recent Scans</h4>
          
          <div className="space-y-1">
            {scanHistory.map(item => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-2 rounded text-xs ${
                  item.isValid 
                    ? 'bg-green-600 bg-opacity-75 text-white' 
                    : 'bg-red-600 bg-opacity-75 text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {item.isValid ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  
                  <span className="font-mono">{item.result.text}</span>
                  <span className="opacity-75">({item.result.format})</span>
                </div>
                
                <span className="opacity-75">
                  {item.result.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* CSS Animation */}
      <style>{`
        @keyframes scan-line {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
};

export default EnhancedBarcodeScanner;
export type { BarcodeResult, EnhancedBarcodeScannerProps };