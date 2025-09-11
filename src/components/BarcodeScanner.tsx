import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { Camera, X, Zap, ZapOff, RotateCcw, CheckCircle, Mic, MicOff, Keyboard } from 'lucide-react';
import TouchGestureHandler, { hapticFeedback } from './TouchGestureHandler';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  description?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScan,
  title = "Scan Barcode",
  description = "Position the barcode within the frame to scan"
}) => {
  const { isDark } = useTheme();
  const { showError, showSuccess } = useNotification();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const themeClasses = {
    modal: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    overlay: 'bg-black bg-opacity-50',
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-600',
      muted: isDark ? 'text-gray-400' : 'text-gray-500'
    },
    button: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: isDark ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300',
      danger: 'bg-red-600 hover:bg-red-700 text-white'
    }
  };

  // Initialize camera and voice recognition when modal opens
  useEffect(() => {
    if (isOpen) {
      initializeCamera();
      initializeVoiceRecognition();
    } else {
      stopCamera();
      stopVoiceRecognition();
    }

    return () => {
      stopCamera();
      stopVoiceRecognition();
    };
  }, [isOpen]);

  // Initialize voice recognition
  const initializeVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        handleVoiceInput(transcript);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        showError('Voice Recognition Error', 'Failed to recognize speech');
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const initializeCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: window.innerWidth > 768 ? 1280 : 640 },
          height: { ideal: window.innerWidth > 768 ? 720 : 480 },
          frameRate: { ideal: 30, max: 60 },
          focusMode: 'continuous',
          exposureMode: 'continuous',
          whiteBalanceMode: 'continuous'
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      // Start scanning after video is ready
      setTimeout(() => {
        startScanning();
      }, 1000);

    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasPermission(false);
      showError(
        'Camera Access Denied',
        'Please allow camera access to use the barcode scanner'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  };

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsScanning(true);
    
    // Simulate barcode scanning (in a real implementation, you'd use a library like QuaggaJS or ZXing)
    scanIntervalRef.current = setInterval(() => {
      scanForBarcode();
    }, 500);
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  };

  // Simulated barcode scanning function
  // In a real implementation, this would use a barcode scanning library
  const scanForBarcode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // In a real implementation, you would analyze the image data here
    // For demo purposes, we'll simulate finding a barcode occasionally
    if (Math.random() < 0.1) { // 10% chance to "find" a barcode
      const simulatedBarcode = generateSimulatedBarcode();
      handleBarcodeDetected(simulatedBarcode);
    }
  };

  const generateSimulatedBarcode = (): string => {
    // Generate a realistic-looking barcode for demo
    const prefixes = ['123', '456', '789', '012', '345'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix}${suffix}${Math.floor(Math.random() * 10)}`;
  };

  const handleBarcodeDetected = useCallback((barcode: string) => {
    if (barcode === lastScannedCode) return; // Avoid duplicate scans

    setLastScannedCode(barcode);
    setScanHistory(prev => [barcode, ...prev.slice(0, 4)]); // Keep last 5 scans
    
    // Provide haptic feedback
    hapticFeedback([200, 100, 200]);

    showSuccess('Barcode Scanned', `Code: ${barcode}`);
    onScan(barcode);
    
    // Auto-close after successful scan
    setTimeout(() => {
      onClose();
    }, 1500);
  }, [lastScannedCode, onScan, onClose, showSuccess]);

  // Handle voice input
  const handleVoiceInput = useCallback((transcript: string) => {
    // Extract numbers from voice input
    const numbers = transcript.replace(/\D/g, '');
    if (numbers.length >= 6) {
      handleBarcodeDetected(numbers);
    } else {
      showError('Invalid Voice Input', 'Please speak a valid barcode number');
    }
  }, [handleBarcodeDetected, showError]);

  // Start voice recognition
  const startVoiceRecognition = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
      hapticFeedback(50);
    }
  };

  // Switch camera facing mode
  const switchCamera = async () => {
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(newFacing);
    
    // Restart camera with new facing mode
    stopCamera();
    setTimeout(() => {
      initializeCamera();
    }, 500);
    
    hapticFeedback(30);
  };

  // Handle manual input
  const handleManualSubmit = () => {
    if (manualInput.trim().length >= 6) {
      handleBarcodeDetected(manualInput.trim());
      setManualInput('');
      setShowManualInput(false);
    } else {
      showError('Invalid Input', 'Please enter a valid barcode');
    }
  };

  const toggleTorch = async () => {
    if (!stream) return;

    try {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();

      if ('torch' in capabilities) {
        await track.applyConstraints({
          advanced: [{ torch: !torchEnabled } as any]
        });
        setTorchEnabled(!torchEnabled);
      } else {
        showError('Torch Not Available', 'Your device does not support flashlight control');
      }
    } catch (error) {
      console.error('Error toggling torch:', error);
      showError('Torch Error', 'Failed to toggle flashlight');
    }
  };

  const handleManualInput = () => {
    const barcode = prompt('Enter barcode manually:');
    if (barcode && barcode.trim()) {
      handleBarcodeDetected(barcode.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${themeClasses.overlay} mobile-modal`}>
      <TouchGestureHandler
        onSwipeDown={onClose}
        onDoubleTap={() => switchCamera()}
        className="w-full h-full flex items-end justify-center"
      >
        <div className={`${themeClasses.modal} mobile-modal-content w-full max-w-md mx-4 rounded-t-xl shadow-xl overflow-hidden safe-area-bottom`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>{title}</h3>
            <p className={`text-sm ${themeClasses.text.secondary}`}>{description}</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-md ${themeClasses.button.secondary} hover:bg-gray-100 dark:hover:bg-gray-700`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative">
          {hasPermission === false ? (
            <div className="p-8 text-center">
              <Camera className={`h-16 w-16 mx-auto mb-4 ${themeClasses.text.muted}`} />
              <p className={`${themeClasses.text.primary} mb-2`}>Camera Access Required</p>
              <p className={`text-sm ${themeClasses.text.secondary} mb-4`}>
                Please allow camera access to use the barcode scanner
              </p>
              <button
                onClick={initializeCamera}
                className={`px-4 py-2 rounded-md ${themeClasses.button.primary}`}
              >
                Enable Camera
              </button>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover bg-black"
                autoPlay
                playsInline
                muted
              />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-blue-500 w-48 h-32 relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
                  
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-red-500 animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status indicator */}
              <div className="absolute top-2 left-2">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  isScanning ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isScanning ? 'bg-white animate-pulse' : 'bg-gray-300'
                  }`}></div>
                  {isScanning ? 'Scanning...' : 'Ready'}
                </div>
              </div>

              {/* Mobile Controls */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex justify-center gap-3">
                  {/* Torch Button */}
                  <button
                    onClick={toggleTorch}
                    className={`touch-target btn-mobile ${
                      torchEnabled ? 'bg-yellow-500 text-white' : 'bg-gray-700 text-white'
                    }`}
                    title="Toggle Flashlight"
                  >
                    {torchEnabled ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
                  </button>
                  
                  {/* Voice Search Button */}
                  <button
                    onClick={startVoiceRecognition}
                    disabled={!recognitionRef.current || isListening}
                    className={`touch-target btn-mobile ${
                      isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-purple-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Voice Search"
                  >
                    {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                  
                  {/* Camera Switch Button */}
                  <button
                    onClick={switchCamera}
                    className="touch-target btn-mobile bg-blue-600 text-white"
                    title="Switch Camera"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>
                  
                  {/* Manual Input Button */}
                  <button
                    onClick={() => setShowManualInput(true)}
                    className="touch-target btn-mobile bg-green-600 text-white"
                    title="Manual Input"
                  >
                    <Keyboard className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Recent Scans */}
        {scanHistory.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className={`text-sm font-medium ${themeClasses.text.primary} mb-2`}>Recent Scans</h4>
            <div className="space-y-1">
              {scanHistory.map((code, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className={`text-sm ${themeClasses.text.secondary} font-mono`}>{code}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Input Modal */}
        {showManualInput && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className={`${themeClasses.modal} rounded-lg p-6 w-full max-w-sm`}>
              <h4 className={`text-lg font-semibold ${themeClasses.text.primary} mb-4`}>
                Enter Barcode Manually
              </h4>
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter barcode number..."
                className={`input-mobile ${themeClasses.searchInput} mb-4`}
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowManualInput(false)}
                  className={`flex-1 btn-mobile ${themeClasses.button.secondary}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualSubmit}
                  className={`flex-1 btn-mobile ${themeClasses.button.primary}`}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-3">
            {/* Instructions */}
            <div className="text-center">
              <p className={`text-sm ${themeClasses.text.secondary}`}>
                Double-tap to switch camera • Swipe down to close
              </p>
              {recognitionRef.current && (
                <p className={`text-xs ${themeClasses.text.muted} mt-1`}>
                  Voice search available
                </p>
              )}
            </div>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className={`w-full btn-mobile ${themeClasses.button.danger}`}
            >
              Close Scanner
            </button>
          </div>
        </div>
        </div>
      </TouchGestureHandler>
    </div>
  );
};

export default BarcodeScanner;