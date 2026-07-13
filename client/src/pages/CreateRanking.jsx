import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../api/axios';
import ImageSourcePicker from '../components/rankings/ImageSourcePicker';
import { 
  Sparkles, Save, ArrowLeft, ArrowRight, Plus, 
  Trash2, ChevronUp, ChevronDown, CheckCircle, FileText 
} from 'lucide-react';

const categories = [
  { id: 'movies', label: 'Movies & TV' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'sports', label: 'Sports' },
  { id: 'tech', label: 'Tech' },
  { id: 'travel', label: 'Travel' },
  { id: 'music', label: 'Music' },
  { id: 'food', label: 'Food' },
  { id: 'general', label: 'Other' },
];

const CreateRanking = () => {
  const navigate = useNavigate();

  // Wizard Steps
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  // Step 1 States: List Details
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('movies');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isCommunitySourced, setIsCommunitySourced] = useState(false);

  // Step 2 States: List Items
  const [items, setItems] = useState([]);
  
  // Current Item form states
  const [currentItemTitle, setCurrentItemTitle] = useState('');
  const [currentItemDesc, setCurrentItemDesc] = useState('');
  const [currentItemImage, setCurrentItemImage] = useState(null); // { url, source, publicId }
  const [editingIndex, setEditingIndex] = useState(-1);

  // Zod equivalent validator checks
  const validateStep1 = () => {
    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      return false;
    }
    if (!category) {
      setError('Category is required');
      return false;
    }
    setError('');
    return true;
  };

  const addOrUpdateItem = () => {
    if (!currentItemTitle.trim()) {
      setError('Item title is required');
      return;
    }

    const newItem = {
      title: currentItemTitle.trim(),
      description: currentItemDesc.trim(),
      image: currentItemImage || { url: '', source: 'upload', publicId: '' },
      aiGenerated: {
        description: false,
        tags: false,
        image: currentItemImage?.source === 'ai-generated',
      },
    };

    if (editingIndex > -1) {
      // Update existing item
      const updated = [...items];
      updated[editingIndex] = {
        ...updated[editingIndex],
        ...newItem,
      };
      // Retain rankNumber
      setItems(updated);
      setEditingIndex(-1);
    } else {
      // Add new item
      if (items.length >= 10) {
        setError('A ranking list cannot exceed 10 items');
        return;
      }
      setItems([...items, { ...newItem, rankNumber: items.length + 1 }]);
    }

    // Reset item form
    setCurrentItemTitle('');
    setCurrentItemDesc('');
    setCurrentItemImage(null);
    setError('');
  };

  const handleEditItem = (index) => {
    const item = items[index];
    setEditingIndex(index);
    setCurrentItemTitle(item.title);
    setCurrentItemDesc(item.description);
    setCurrentItemImage(item.image);
  };

  const handleRemoveItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    // Re-index rank numbers
    const reindexed = updated.map((item, idx) => ({
      ...item,
      rankNumber: idx + 1,
    }));
    setItems(reindexed);
  };

  // Reorder rankings
  const moveItem = (index, direction) => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    const reordered = [...items];
    const temp = reordered[index];
    reordered[index] = reordered[nextIndex];
    reordered[nextIndex] = temp;

    // Correct the rankNumber fields
    const corrected = reordered.map((item, idx) => ({
      ...item,
      rankNumber: idx + 1,
    }));
    setItems(corrected);
  };

  // API Call Mutation
  const createRankingMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/rankings', payload);
      return response.data;
    },
    onSuccess: (data) => {
      navigate(`/ranking/${data.ranking._id}`);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to publish ranking list');
    },
  });

  const handlePublish = () => {
    if (items.length === 0) {
      setError('Please add at least one item to your ranking list');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const payload = {
      title: title.trim(),
      category,
      description: description.trim(),
      tags,
      items,
      isCommunitySourced,
    };

    createRankingMutation.mutate(payload);
  };

  const onSelectImage = (url, source, publicId, aiDescription, aiTags) => {
    setCurrentItemImage({ url, source, publicId });
    if (aiDescription && !currentItemDesc) {
      setCurrentItemDesc(aiDescription);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 flex items-center space-x-2">
            <span>Create New Standings</span>
          </h1>
          <p className="text-sm text-slate-450 mt-1">Design a Top 10 list and share it with the world</p>
        </div>
      </div>

      {/* Step Wizard Navigator indicators */}
      <div className="flex items-center space-x-2.5">
        <div className={`flex items-center space-x-2 text-sm font-semibold ${step === 1 ? 'text-indigo-400' : 'text-slate-500'}`}>
          <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs">1</span>
          <span>List Details</span>
        </div>
        <div className="w-10 h-px bg-slate-800" />
        <div className={`flex items-center space-x-2 text-sm font-semibold ${step === 2 ? 'text-indigo-400' : 'text-slate-500'}`}>
          <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs">2</span>
          <span>Ranking Items</span>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded">
          {error}
        </div>
      )}

      {/* Step 1: List Details */}
      {step === 1 && (
        <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Ranking Title (e.g. Best Sci-Fi Movies)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title..."
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="movies, scifi, top10"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-550 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Description / Context
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Provide details about why you constructed this ranking..."
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div className="flex items-center space-x-2.5 pt-2">
              <input
                id="community-sourced"
                type="checkbox"
                checked={isCommunitySourced}
                onChange={(e) => setIsCommunitySourced(e.target.checked)}
                className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 bg-slate-950 w-4.5 h-4.5"
              />
              <label htmlFor="community-sourced" className="text-sm text-slate-300 font-semibold cursor-pointer">
                Allow others to vote on items inside this list
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-850">
            <button
              onClick={() => {
                if (validateStep1()) {
                  setStep(2);
                }
              }}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-2 shadow-lg shadow-indigo-500/15"
            >
              <span>Next: Add Items</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Ranking Items */}
      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Item Add/Edit form - left 5 cols */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl space-y-4">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <Plus className="w-4.5 h-4.5 text-indigo-400" />
                <span>{editingIndex > -1 ? 'Edit Item Details' : 'Add New Item'}</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Entry Title
                  </label>
                  <input
                    type="text"
                    value={currentItemTitle}
                    onChange={(e) => setCurrentItemTitle(e.target.value)}
                    placeholder="e.g. Inception"
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-850 rounded text-slate-100 placeholder-slate-550 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={currentItemDesc}
                    onChange={(e) => setCurrentItemDesc(e.target.value)}
                    rows={2}
                    placeholder="e.g. An elegant mind-bending sci-fi heist movie..."
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-850 rounded text-slate-100 placeholder-slate-550 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                {/* Smart Image Assistant integration */}
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Entry Image (Manual / Stock / AI)
                  </label>
                  <ImageSourcePicker
                    itemTitle={currentItemTitle}
                    rankingCategory={category}
                    currentImage={currentItemImage}
                    onSelectImage={onSelectImage}
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={addOrUpdateItem}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded text-xs transition flex items-center justify-center space-x-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingIndex > -1 ? 'Update Entry' : 'Add to List'}</span>
                </button>
                {editingIndex > -1 && (
                  <button
                    onClick={() => {
                      setEditingIndex(-1);
                      setCurrentItemTitle('');
                      setCurrentItemDesc('');
                      setCurrentItemImage(null);
                    }}
                    className="py-2 px-3 border border-slate-800 text-slate-450 hover:text-white rounded text-xs transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Added items list - right 7 cols */}
          <div className="md:col-span-7 space-y-4">
            <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                  <FileText className="w-4.5 h-4.5 text-indigo-400" />
                  <span>Standing Items List ({items.length}/10)</span>
                </h2>
                <span className="text-[10px] text-slate-500">Sorted from #1 to #10</span>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-850 rounded bg-slate-950/10">
                  <p className="text-xs text-slate-500">No items added to this list yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-950/40 border border-slate-850/80 p-2.5 rounded-lg group"
                    >
                      <div className="flex items-center space-x-3">
                        {/* Rank Circle */}
                        <span className="w-6 h-6 rounded-full bg-slate-850 text-indigo-400 text-xs font-black flex items-center justify-center border border-slate-800">
                          {item.rankNumber}
                        </span>

                        {item.image?.url && (
                          <img
                            src={item.image.url}
                            alt=""
                            className="w-10 h-10 object-cover rounded bg-slate-900"
                          />
                        )}

                        <div className="truncate max-w-[320px] md:max-w-[450px]">
                          <p className="text-xs font-bold text-slate-200 truncate">{item.title}</p>
                          <p className="text-[10px] text-slate-500 truncate">{item.description || 'No description'}</p>
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center space-x-1">
                        {/* Up/Down buttons */}
                        <button
                          onClick={() => moveItem(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 disabled:opacity-30"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveItem(idx, 'down')}
                          disabled={idx === items.length - 1}
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 disabled:opacity-30"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit/Delete */}
                        <button
                          onClick={() => handleEditItem(idx)}
                          className="p-1 rounded bg-slate-900 hover:bg-indigo-500/10 text-indigo-400"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 rounded bg-slate-900 hover:bg-rose-500/10 text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Publish Controls */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-850">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-800 rounded-lg text-xs font-semibold text-slate-450 hover:text-white flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  onClick={handlePublish}
                  disabled={items.length === 0 || createRankingMutation.isPending}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-650 hover:opacity-90 disabled:opacity-40 flex items-center space-x-1.5 shadow-lg shadow-indigo-500/15"
                >
                  {createRankingMutation.isPending ? (
                    <span>Publishing...</span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Publish Standings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateRanking;
