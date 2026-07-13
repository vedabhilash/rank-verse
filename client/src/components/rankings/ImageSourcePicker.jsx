import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Upload, Search, Sparkles, Image as ImageIcon, Loader2, Check } from 'lucide-react';

const ImageSourcePicker = ({ itemTitle, rankingCategory, currentImage, onSelectImage }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Tab 1: Upload States
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');

  // Tab 2: Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Tab 3: AI Gen States
  const [generatedPreview, setGeneratedPreview] = useState('');

  // Keep track of the selected image details
  const [selectedImageUrl, setSelectedImageUrl] = useState(currentImage?.url || '');

  // Pre-fill search query from itemTitle on mount
  useEffect(() => {
    if (itemTitle) {
      setSearchQuery(itemTitle);
    }
  }, [itemTitle]);

  const handleError = (err) => {
    const msg = err.response?.data?.message || err.message || 'Operation failed';
    setError(msg);
  };

  // 1. Upload Handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      // Upload to Cloudinary
      const response = await api.post('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { url, publicId } = response.data;
      setSelectedImageUrl(url);

      // Describe uploaded image using Gemini
      let description = '';
      let tags = [];
      try {
        const describeResponse = await api.post('/ai/describe-image', { imageUrl: url });
        description = describeResponse.data.description;
        tags = describeResponse.data.tags;
      } catch (err) {
        console.warn('Gemini description service failed, skipping metadata populate', err);
      }

      onSelectImage(url, 'upload', publicId, description, tags);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Search Handler
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError('');
    setSearchResults([]);

    try {
      const response = await api.get(`/images/search`, { params: { query: searchQuery } });
      setSearchResults(response.data.images || []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSearchedImage = async (image) => {
    setLoading(true);
    setError('');
    setSelectedImageUrl(image.url);

    try {
      // Describe selected stock image using Gemini
      let description = '';
      let tags = [];
      try {
        const describeResponse = await api.post('/ai/describe-image', { imageUrl: image.url });
        description = describeResponse.data.description;
        tags = describeResponse.data.tags;
      } catch (err) {
        console.warn('Gemini description failed for stock image', err);
      }

      onSelectImage(image.url, image.source, '', description, tags);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // 3. AI Generation Handler
  const handleGenerateAIImage = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/ai/generate-image', {
        title: itemTitle || 'Secret Spot',
        category: rankingCategory || 'general',
      });

      const { imageUrl, description, tags } = response.data;
      setGeneratedPreview(imageUrl);
      setSelectedImageUrl(imageUrl);

      onSelectImage(imageUrl, 'ai-generated', '', description, tags);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'upload', label: 'Upload Image', icon: Upload },
    { id: 'search', label: 'Search Stock', icon: Search },
    { id: 'generate', label: 'Generate AI', icon: Sparkles },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
      {/* Tabs list */}
      <div className="flex border-b border-slate-800 mb-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setError('');
              }}
              className={`flex items-center space-x-2 px-4 py-2 border-b-2 text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error Messaging */}
      {error && (
        <div className="mb-4 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded">
          {error}
        </div>
      )}

      {/* Tab Panel 1: Upload */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <div className="flex items-center justify-center border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-lg p-6 bg-slate-950/20 transition-all duration-200">
            <div className="text-center">
              {uploadPreview ? (
                <div className="relative group w-40 h-40 mx-auto rounded overflow-hidden">
                  <img src={uploadPreview} alt="Upload Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <p className="text-xs text-white">Change File</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <ImageIcon className="w-10 h-10 text-slate-500 mb-2" />
                  <p className="text-sm font-medium text-slate-300">Drag or click to choose an image</p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {selectedFile && !selectedImageUrl && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing with AI...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload & Analyze with AI</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Tab Panel 2: Search */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stock images..."
              className="flex-1 px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded disabled:opacity-50 text-sm flex items-center space-x-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Search</span>
            </button>
          </div>

          {loading && searchResults.length === 0 ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {searchResults.map((image, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchedImage(image)}
                  className="relative h-20 w-full rounded overflow-hidden group focus:outline-none border border-slate-800 hover:border-indigo-500"
                >
                  <img src={image.thumbnailUrl} alt="Stock match" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <p className="text-[10px] text-white truncate max-w-[80px]">{image.photographer}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Panel 3: AI Gen */}
      {activeTab === 'generate' && (
        <div className="space-y-4">
          <div className="bg-slate-950/40 border border-slate-850 p-4 rounded text-xs text-slate-400 space-y-2 leading-relaxed">
            <p><strong>Title Context:</strong> "{itemTitle || 'Not defined yet'}"</p>
            <p><strong>Category Context:</strong> "{rankingCategory || 'Not defined yet'}"</p>
            <p>Our Smart Image Assistant will generate a unique photo matching this item details and auto-write a description and tags using Gemini in parallel.</p>
          </div>

          {generatedPreview ? (
            <div className="relative w-40 h-40 mx-auto rounded overflow-hidden border border-slate-800">
              <img src={generatedPreview} alt="AI Generated" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                <span className="bg-indigo-600/90 text-white text-xxs font-bold px-2 py-0.5 rounded flex items-center space-x-1 border border-indigo-400/40">
                  <Check className="w-3 h-3" />
                  <span>Selected</span>
                </span>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleGenerateAIImage}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white font-semibold disabled:opacity-50 text-sm shadow-md shadow-indigo-500/10"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Image & Analysis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Image with AI</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Selected indicator */}
      {selectedImageUrl && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded overflow-hidden bg-slate-950 border border-slate-800">
              <img src={selectedImageUrl} alt="Mini Preview" className="w-full h-full object-cover" />
            </div>
            <span className="text-slate-400 font-medium truncate max-w-[200px]">Image attached successfully</span>
          </div>
          <span className="text-indigo-400 flex items-center space-x-0.5 font-semibold">
            <Check className="w-3.5 h-3.5" />
            <span>Success</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default ImageSourcePicker;
