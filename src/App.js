import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Image, Plus, Search, Filter, Download, Eye, Trash2, Edit3, User, LogOut, Settings } from 'lucide-react';

const MechCountApp = () => {
  const [currentUser, setCurrentUser] = useState({ id: 1, email: 'engineer@company.com', name: 'John Engineer' });
  const [projects, setProjects] = useState([
    { id: 1, name: 'Engine Block Analysis', description: 'Analyzing engine components', created_at: '2024-11-15', documents: [] },
    { id: 2, name: 'Transmission Parts', description: 'Transmission component count', created_at: '2024-11-20', documents: [] }
  ]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [processingResults, setProcessingResults] = useState([]);
  const [currentView, setCurrentView] = useState('projects'); // 'projects' or 'documents'
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  // Mock ML processing simulation
  const simulatePartDetection = (filename) => {
    const mockResults = {
      parts: [
        { type: 'Bolt', count: 12, confidence: 0.92, color: '#FF6B6B' },
        { type: 'Nut', count: 8, confidence: 0.88, color: '#4ECDC4' },
        { type: 'Washer', count: 15, confidence: 0.95, color: '#45B7D1' },
        { type: 'Screw', count: 6, confidence: 0.87, color: '#96CEB4' },
        { type: 'Bearing', count: 4, confidence: 0.91, color: '#FFEAA7' }
      ],
      totalParts: 45,
      processingTime: '24.3s',
      accuracy: '89.2%'
    };
    return mockResults;
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = async (files) => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }

    setProcessing(true);
    const file = files[0];
    
    // Simulate file processing delay
    setTimeout(() => {
      const newDocument = {
        id: Date.now(),
        project_id: selectedProject.id,
        filename: file.name,
        file_type: file.type,
        upload_date: new Date().toISOString(),
        size: file.size,
        processed: true
      };

      const results = simulatePartDetection(file.name);
      
      setDocuments(prev => [...prev, newDocument]);
      setProcessingResults(prev => [...prev, { document_id: newDocument.id, ...results }]);
      setProcessing(false);
      setShowUploadModal(false);
    }, 3000);
  };

  const createProject = (projectData) => {
    const newProject = {
      id: Date.now(),
      ...projectData,
      created_at: new Date().toISOString().split('T')[0],
      documents: []
    };
    setProjects(prev => [...prev, newProject]);
    setShowNewProjectModal(false);
  };

  const ProjectModal = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState({ name: '', description: '' });
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Project Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Project Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border rounded-lg h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => onSubmit(formData)}
              disabled={!formData.name.trim()}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Create Project
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const UploadModal = ({ onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <h3 className="text-lg font-semibold mb-4">Upload Document</h3>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">Drag and drop your files here</p>
            <p className="text-sm text-gray-500 mb-4">or</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.tiff"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Browse Files
            </button>
            <p className="text-xs text-gray-500 mt-4">
              Supported formats: PDF, PNG, JPG, TIFF (Max 10MB)
            </p>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ResultsView = ({ documentId }) => {
    const results = processingResults.find(r => r.document_id === documentId);
    if (!results) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Detection Results</h3>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Eye className="h-4 w-4" />
              View Highlights
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Parts</p>
            <p className="text-2xl font-bold text-blue-600">{results.totalParts}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Accuracy</p>
            <p className="text-2xl font-bold text-green-600">{results.accuracy}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Processing Time</p>
            <p className="text-2xl font-bold text-purple-600">{results.processingTime}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold">Detected Parts</h4>
          {results.parts.map((part, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: part.color }}
                ></div>
                <span className="font-medium">{part.type}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold">{part.count}</span>
                <span className="text-sm text-gray-500">{(part.confidence * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">AutoCount</h1>
              <span className="ml-2 text-sm text-gray-500">Mechanical Parts Analyzer</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{currentUser.name}</span>
              </div>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Settings className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 mb-8">
          {currentView === 'documents' && (
            <>
              <button
                onClick={() => setCurrentView('projects')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Projects
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-700 font-medium">{selectedProject?.name}</span>
            </>
          )}
        </div>

        {/* Projects View */}
        {currentView === 'projects' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div 
                  key={project.id}
                  className={`bg-white rounded-lg shadow-sm border p-6 cursor-pointer transition-all ${
                    selectedProject?.id === project.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                  }`}
                  onClick={() => {
                    setSelectedProject(project);
                    setCurrentView('documents');
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <div className="flex gap-1">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Created: {project.created_at}</span>
                    <span>{documents.filter(d => d.project_id === project.id).length} docs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents View */}
        {currentView === 'documents' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentView('projects')}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Projects
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProject?.name}</h2>
                  <p className="text-gray-600">{selectedProject?.description}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50">
                  <Filter className="h-4 w-4" />
                  Filter
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4" />
                  Upload Document
                </button>
              </div>
            </div>

            {documents.filter(d => d.project_id === selectedProject?.id).length === 0 ? (
              <div className="text-center py-12">
                <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No documents uploaded yet</p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Upload First Document
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {documents
                  .filter(d => d.project_id === selectedProject?.id)
                  .map((doc) => (
                    <div key={doc.id} className="bg-white rounded-lg shadow-sm border">
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                            {doc.file_type?.includes('pdf') ? (
                              <FileText className="h-8 w-8 text-red-500" />
                            ) : (
                              <Image className="h-8 w-8 text-blue-500" />
                            )}
                            <div>
                              <h3 className="font-semibold">{doc.filename}</h3>
                              <p className="text-sm text-gray-500">
                                Uploaded: {new Date(doc.upload_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.processed && (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                Processed
                              </span>
                            )}
                            <button className="p-2 text-gray-400 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        {doc.processed && <ResultsView documentId={doc.id} />}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Processing Overlay */}
      {processing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Processing Document</h3>
            <p className="text-gray-600">Analyzing mechanical parts...</p>
          </div>
        </div>
      )}

      {/* Modals */}
      {showNewProjectModal && (
        <ProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onSubmit={createProject}
        />
      )}

      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} />
      )}
    </div>
  );
};

export default MechCountApp;