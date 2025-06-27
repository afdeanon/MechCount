import React, { useState, useRef, useCallback, useEffect, createContext, useContext } from 'react';
import { Upload, FileText, Image, Plus, Search, Filter, Download, Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, Trash2, Edit3, User, LogOut, Settings, Chrome } from 'lucide-react';

// Authentication Context
const AuthContext = createContext();

// Mock authentication service (replace with your actual API calls)
const authService = {
  // Simulate API delay
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock user database
  users: [
    { id: 1, email: 'test@example.com', password: 'password123', name: 'Test User', verified: true }
  ],
  
  // Mock login attempts tracking
  loginAttempts: {},
  
  async register(email, password, name) {
    await this.delay(1000);
    
    // Check if user exists
    const existingUser = this.users.find(u => u.email === email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Create new user
    const newUser = {
      id: this.users.length + 1,
      email,
      password, // In real app, this would be hashed
      name,
      verified: false
    };
    
    this.users.push(newUser);
    return { success: true, message: 'Registration successful! Please check your email for verification.' };
  },
  
  async login(email, password) {
    await this.delay(1000);
    
    // Check login attempts
    const attempts = this.loginAttempts[email] || 0;
    if (attempts >= 3) {
      throw new Error('Too many failed attempts. Please try again later.');
    }
    
    // Find user
    const user = this.users.find(u => u.email === email);
    if (!user || user.password !== password) {
      this.loginAttempts[email] = attempts + 1;
      throw new Error('Invalid email or password');
    }
    
    if (!user.verified) {
      throw new Error('Please verify your email before logging in');
    }
    
    // Reset login attempts on successful login
    delete this.loginAttempts[email];
    
    return {
      token: `mock-jwt-token-${user.id}`,
      user: { id: user.id, email: user.email, name: user.name }
    };
  },
  
  async googleLogin() {
    await this.delay(1500);
    // Mock Google OAuth response
    return {
      token: 'mock-google-jwt-token',
      user: { id: 99, email: 'google@example.com', name: 'Google User' }
    };
  },
  
  async verifyEmail(email) {
    await this.delay(1000);
    const user = this.users.find(u => u.email === email);
    if (user) {
      user.verified = true;
      return { success: true };
    }
    throw new Error('User not found');
  },
  
  logout() {
    // Clear session data
    return { success: true };
  }
};

// Auth Provider Component
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(null);
  
  // Auto logout after 30 minutes of inactivity
  const resetSessionTimeout = () => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }
    
    const timeout = setTimeout(() => {
      logout();
    }, 30 * 60 * 1000); // 30 minutes
    
    setSessionTimeout(timeout);
  };
  
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      resetSessionTimeout();
      return response;
    } finally {
      setLoading(false);
    }
  };
  
  const register = async (email, password, name) => {
    setLoading(true);
    try {
      return await authService.register(email, password, name);
    } finally {
      setLoading(false);
    }
  };
  
  const googleLogin = async () => {
    setLoading(true);
    try {
      const response = await authService.googleLogin();
      setUser(response.user);
      resetSessionTimeout();
      return response;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    setUser(null);
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
    authService.logout();
  };
  
  const verifyEmail = async (email) => {
    return await authService.verifyEmail(email);
  };
  
  // Reset session timeout on user activity
  useEffect(() => {
    if (user) {
      const handleActivity = () => resetSessionTimeout();
      
      window.addEventListener('mousedown', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('scroll', handleActivity);
      
      return () => {
        window.removeEventListener('mousedown', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('scroll', handleActivity);
      };
    }
  }, [user]);
  
  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      googleLogin,
      logout,
      verifyEmail,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Input Component
function Input({ icon: Icon, type = 'text', placeholder, value, onChange, error, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' && showPassword ? 'text' : type;
  
  return (
    <div className="relative">
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        )}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} ${type === 'password' ? 'pr-10' : 'pr-4'} py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          {...props}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
      {error && (
        <div className="flex items-center mt-1 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
}

// Button Component
function Button({ children, variant = 'primary', loading = false, disabled = false, onClick, ...props }) {
  const baseClasses = 'w-full py-3 px-4 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500',
    google: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 focus:ring-gray-500'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${loading ? 'cursor-wait' : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
}

// Alert Component
function Alert({ type = 'info', message, onClose }) {
  const types = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: AlertCircle
  };
  
  const Icon = icons[type];
  
  return (
    <div className={`border rounded-lg p-4 ${types[type]}`}>
      <div className="flex items-center">
        <Icon className="h-5 w-5 mr-2" />
        <span className="text-sm font-medium">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto text-current hover:opacity-75"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// Auth Form Component
function AuthForm() {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'verify'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  
  const { login, register, googleLogin, verifyEmail, loading } = useAuth();
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (mode === 'register') {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    
    if (!validateForm()) return;
    
    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else if (mode === 'register') {
        const response = await register(formData.email, formData.password, formData.name);
        setAlert({ type: 'success', message: response.message });
        setMode('verify');
      }
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
  };
  
  const handleGoogleLogin = async () => {
    setAlert(null);
    try {
      await googleLogin();
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
  };
  
  const handleVerifyEmail = async () => {
    try {
      await verifyEmail(formData.email);
      setAlert({ type: 'success', message: 'Email verified successfully! You can now log in.' });
      setMode('login');
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
  };
  
  const handleInputChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };
  
  if (mode === 'verify') {
    return (
      <div className="text-center">
        <div className="mb-6">
          <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
          <p className="text-gray-600">
            We've sent a verification link to <strong>{formData.email}</strong>
          </p>
        </div>
        
        {alert && (
          <div className="mb-4">
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}
        
        <div className="space-y-4">
          <Button onClick={handleVerifyEmail} loading={loading}>
            Verify Email (Demo)
          </Button>
          
          <button
            onClick={() => setMode('login')}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-gray-600">
          {mode === 'login' 
            ? 'Sign in to your account to continue' 
            : 'Join us today and get started'
          }
        </p>
      </div>
      
      {alert && (
        <div className="mb-6">
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}
      
      <div className="space-y-4">
        {mode === 'register' && (
          <Input
            icon={User}
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleInputChange('name')}
            error={errors.name}
          />
        )}
        
        <Input
          icon={Mail}
          type="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleInputChange('email')}
          error={errors.email}
        />
        
        <Input
          icon={Lock}
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleInputChange('password')}
          error={errors.password}
        />
        
        {mode === 'register' && (
          <Input
            icon={Lock}
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            error={errors.confirmPassword}
          />
        )}
        
        <Button type="button" onClick={handleSubmit} loading={loading}>
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </Button>
      </div>
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
        
        <div className="mt-6">
          <Button variant="google" onClick={handleGoogleLogin} loading={loading}>
            <div className="flex items-center justify-center">
              <Chrome className="h-5 w-5 mr-2" />
              Google
            </div>
          </Button>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <button
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          {mode === 'login' 
            ? "Don't have an account? Sign up" 
            : "Already have an account? Sign in"
          }
        </button>
      </div>
      
      {mode === 'login' && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Demo credentials: test@example.com / password123
          </p>
        </div>
      )}
    </div>
  );
}

function MechCountApp () {
  const { user, logout } = useAuth();
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

export default function MainApp(){
  return (
    <AuthProvider>
      <AuthScreen />
    </AuthProvider>
  );
};

function AuthScreen() {
  const { user } = useAuth();
  
  // If user is authenticated, show main app
  if (user) {
    return <MechCountApp />;
  }
  
  // Otherwise show auth form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}