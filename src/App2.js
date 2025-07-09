import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Upload,
    FileText,
    Eye,
    Download,
    Zap,
    AlertCircle,
    CheckCircle,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Move
} from 'lucide-react';

const MechanicalSymbolDetector = () => {
    const [file, setFile] = useState(null);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [detectionResults, setDetectionResults] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Mock detection results for demonstration
    const mockDetectionResults = {
        totalSymbols: 24,
        symbolCounts: {
            'Valve': 8,
            'Pump': 3,
            'Filter': 4,
            'Pipe Joint': 6,
            'Pressure Gauge': 2,
            'Flow Meter': 1
        },
        detections: [
            { id: 1, type: 'Valve', confidence: 0.95, x: 150, y: 200, width: 40, height: 40 },
            { id: 2, type: 'Pump', confidence: 0.88, x: 300, y: 150, width: 60, height: 50 },
            { id: 3, type: 'Filter', confidence: 0.92, x: 450, y: 180, width: 45, height: 35 },
            { id: 4, type: 'Valve', confidence: 0.89, x: 200, y: 350, width: 40, height: 40 },
            { id: 5, type: 'Pipe Joint', confidence: 0.94, x: 100, y: 100, width: 25, height: 25 },
            { id: 6, type: 'Pressure Gauge', confidence: 0.91, x: 500, y: 250, width: 35, height: 35 },
            { id: 7, type: 'Valve', confidence: 0.87, x: 600, y: 300, width: 40, height: 40 },
            { id: 8, type: 'Filter', confidence: 0.93, x: 750, y: 180, width: 45, height: 35 },
            { id: 9, type: 'Pump', confidence: 0.91, x: 400, y: 450, width: 60, height: 50 },
            { id: 10, type: 'Pipe Joint', confidence: 0.89, x: 850, y: 100, width: 25, height: 25 }
        ]
    };

    const handleFileUpload = useCallback((event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (!validTypes.includes(selectedFile.type)) {
                setError('Please upload a valid image (JPEG, PNG) or PDF file.');
                return;
            }

            // Validate file size (max 10MB)
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB.');
                return;
            }

            setFile(selectedFile);
            setError(null);
            setDetectionResults(null);
            resetZoomAndPan();

            // Create preview for images
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setUploadedImage(e.target.result);
                };
                reader.readAsDataURL(selectedFile);
            }
        }
    }, []);

    const resetZoomAndPan = () => {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
    };

    const processFile = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);

        try {
            // Simulate API call to AWS Lambda function
            await new Promise(resolve => setTimeout(resolve, 3000));

            // In a real implementation, you would:
            // 1. Upload file to S3
            // 2. Call AWS Lambda function with Rekognition/SageMaker
            // 3. Process the response

            setDetectionResults(mockDetectionResults);
        } catch (err) {
            setError('Error processing file. Please try again.');
            console.error('Processing error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const drawBoundingBoxes = useCallback(() => {
        if (!uploadedImage || !canvasRef.current || !detectionResults) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Set canvas size to image size
            canvas.width = img.width;
            canvas.height = img.height;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw image
            ctx.drawImage(img, 0, 0);

            // Draw bounding boxes
            detectionResults.detections.forEach((detection) => {
                const colors = {
                    'Valve': '#FF6B6B',
                    'Pump': '#4ECDC4',
                    'Filter': '#45B7D1',
                    'Pipe Joint': '#96CEB4',
                    'Pressure Gauge': '#FFEAA7',
                    'Flow Meter': '#DDA0DD'
                };

                ctx.strokeStyle = colors[detection.type] || '#FF6B6B';
                ctx.lineWidth = 3;
                ctx.strokeRect(detection.x, detection.y, detection.width, detection.height);

                // Draw label background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                const labelText = `${detection.type} (${Math.round(detection.confidence * 100)}%)`;
                ctx.font = '14px Arial';
                const textMetrics = ctx.measureText(labelText);
                ctx.fillRect(detection.x, detection.y - 25, textMetrics.width + 10, 20);

                // Draw label text
                ctx.fillStyle = 'white';
                ctx.fillText(labelText, detection.x + 5, detection.y - 8);
            });
        };

        img.src = uploadedImage;
    }, [uploadedImage, detectionResults]);

    // Redraw canvas when zoom or pan changes
    useEffect(() => {
        drawBoundingBoxes();
    }, [drawBoundingBoxes]);

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev * 1.2, 5));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev / 1.2, 0.1));
    };

    const handleMouseDown = (e) => {
        if (e.button === 0) { // Left mouse button
            setIsDragging(true);
            setDragStart({
                x: e.clientX - panOffset.x,
                y: e.clientY - panOffset.y
            });
            e.preventDefault();
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPanOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoomLevel(prev => Math.max(0.1, Math.min(5, prev * delta)));
    };

    // Add event listeners for mouse events
    useEffect(() => {
        const handleGlobalMouseMove = (e) => handleMouseMove(e);
        const handleGlobalMouseUp = () => handleMouseUp();

        if (isDragging) {
            document.addEventListener('mousemove', handleGlobalMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging, dragStart, panOffset]);

    const downloadResults = () => {
        if (!detectionResults) return;

        const results = {
            filename: file.name,
            processedAt: new Date().toISOString(),
            totalSymbols: detectionResults.totalSymbols,
            symbolCounts: detectionResults.symbolCounts,
            detections: detectionResults.detections.map(d => ({
                type: d.type,
                confidence: d.confidence,
                position: { x: d.x, y: d.y, width: d.width, height: d.height }
            }))
        };

        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `detection-results-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        Mechanical Symbol Detection
                    </h1>
                    <p className="text-gray-600">
                        Upload mechanical plans and detect symbols automatically using AI
                    </p>
                </div>

                {/* Upload Section */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                        />

                        {!file ? (
                            <div>
                                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <p className="text-gray-600 mb-4">
                                    Drop your mechanical plan here or click to browse
                                </p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                                >
                                    <Upload className="inline mr-2 h-4 w-4" />
                                    Choose File
                                </button>
                                <p className="text-sm text-gray-500 mt-2">
                                    Supports PDF, JPEG, PNG (max 10MB)
                                </p>
                            </div>
                        ) : (
                            <div>
                                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                                <p className="text-gray-800 font-medium mb-2">{file.name}</p>
                                <p className="text-sm text-gray-500 mb-4">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <div className="flex justify-center space-x-4">
                                    <button
                                        onClick={processFile}
                                        disabled={isProcessing}
                                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
                                    >
                                        <Zap className="inline mr-2 h-4 w-4" />
                                        {isProcessing ? 'Processing...' : 'Detect Symbols'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setFile(null);
                                            setUploadedImage(null);
                                            setDetectionResults(null);
                                            setError(null);
                                            resetZoomAndPan();
                                        }}
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                            <span className="text-red-700">{error}</span>
                        </div>
                    </div>
                )}

                {/* Processing Indicator */}
                {isProcessing && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                            <span className="text-blue-700">Processing your mechanical plan...</span>
                        </div>
                    </div>
                )}

                {/* Results Section */}
                {detectionResults && (
                    <div >
                        {/* Image with Annotations and Zoom Controls */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold flex items-center">
                                    <Eye className="mr-2 h-5 w-5" />
                                    Detection Results
                                </h3>

                                {/* Zoom Controls */}
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={handleZoomOut}
                                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        title="Zoom Out"
                                    >
                                        <ZoomOut className="h-4 w-4" />
                                    </button>
                                    <span className="text-sm font-medium min-w-16 text-center">
                                        {Math.round(zoomLevel * 100)}%
                                    </span>
                                    <button
                                        onClick={handleZoomIn}
                                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        title="Zoom In"
                                    >
                                        <ZoomIn className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={resetZoomAndPan}
                                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        title="Reset View"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center text-sm text-blue-700">
                                    <Move className="h-4 w-4 mr-2" />
                                    <span>Click and drag to pan • Scroll to zoom • Use controls above</span>
                                </div>
                            </div>

                            {uploadedImage && (
                                <div
                                    ref={containerRef}
                                    className="relative border rounded-lg overflow-hidden bg-gray-50"
                                    style={{
                                        height: '500px',
                                        cursor: isDragging ? 'grabbing' : 'grab'
                                    }}
                                    onWheel={handleWheel}
                                >
                                    <div
                                        style={{
                                            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                                            transformOrigin: '0 0',
                                            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                                        }}
                                    >
                                        <canvas
                                            ref={canvasRef}
                                            className="block"
                                            onMouseDown={handleMouseDown}
                                            style={{
                                                maxWidth: 'none',
                                                userSelect: 'none',
                                                WebkitUserSelect: 'none'
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {file && file.type === 'application/pdf' && (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                    <p className="text-gray-600">PDF preview not available</p>
                                    <p className="text-sm text-gray-500">Detection results shown in summary</p>
                                </div>
                            )}
                        </div>

                        {/* Detection Summary */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold">Symbol Count Summary</h3>
                                <button
                                    onClick={downloadResults}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    <Download className="inline mr-2 h-4 w-4" />
                                    Export
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-indigo-600">
                                            {detectionResults.totalSymbols}
                                        </div>
                                        <div className="text-gray-600">Total Symbols Detected</div>
                                    </div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-indigo-600">
                                            {Math.round(detectionResults.detections.reduce((sum, d) => sum + d.confidence, 0) / detectionResults.detections.length * 100)}%
                                        </div>
                                        <div className="text-gray-600">Average Confidence</div>
                                    </div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-indigo-600">
                                            3s
                                        </div>
                                        <div className="text-gray-600">Processing Time</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {Object.entries(detectionResults.symbolCounts).map(([type, count]) => {
                                    const colors = {
                                        'Valve': '#FF6B6B',
                                        'Pump': '#4ECDC4',
                                        'Filter': '#45B7D1',
                                        'Pipe Joint': '#96CEB4',
                                        'Pressure Gauge': '#FFEAA7',
                                        'Flow Meter': '#DDA0DD'
                                    };

                                    return (
                                        <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center">
                                                <div
                                                    className="w-4 h-4 rounded-full mr-3 border-2 border-white shadow-sm"
                                                    style={{ backgroundColor: colors[type] || '#FF6B6B' }}
                                                ></div>
                                                <span className="font-medium">{type}</span>
                                            </div>
                                            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm">
                                                {count}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MechanicalSymbolDetector;