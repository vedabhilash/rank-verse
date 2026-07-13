import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import RankingCard from '../components/rankings/RankingCard';
import { Search, SlidersHorizontal, Library, ChevronLeft, ChevronRight } from 'lucide-react';

const categories = [
  { id: '', label: 'All Categories' },
  { id: 'movies', label: 'Movies & TV' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'sports', label: 'Sports' },
  { id: 'tech', label: 'Tech' },
  { id: 'travel', label: 'Travel' },
  { id: 'music', label: 'Music' },
  { id: 'food', label: 'Food' },
  { id: 'general', label: 'Other' },
];

const sortOptions = [
  { id: 'latest', label: 'Newest Lists' },
  { id: 'trending', label: 'Trending Score' },
  { id: 'popular', label: 'Most Liked' },
  { id: 'views', label: 'Most Viewed' },
];

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortParam = searchParams.get('sort') || 'latest';
  const categoryParam = searchParams.get('category') || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [activeSort, setActiveSort] = useState(sortParam);
  const [currentPage, setCurrentPage] = useState(1);

  // Sync state with URL search params changes (e.g., clicking navbar links)
  useEffect(() => {
    setActiveSort(searchParams.get('sort') || 'latest');
    setActiveCategory(searchParams.get('category') || '');
  }, [searchParams]);

  // We will pass values to API query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['exploreRankings', activeCategory, activeSort, currentPage],
    queryFn: async () => {
      const response = await api.get('/rankings', {
        params: {
          search: searchTerm || undefined,
          category: activeCategory || undefined,
          sort: activeSort,
          page: currentPage,
          limit: 9,
        },
      });
      return response.data;
    },
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  const handleCategorySelect = (catId) => {
    setActiveCategory(catId);
    setCurrentPage(1);
    setSearchParams(prev => {
      if (catId) prev.set('category', catId);
      else prev.delete('category');
      return prev;
    });
  };

  const handleSortSelect = (sortId) => {
    setActiveSort(sortId);
    setCurrentPage(1);
    setSearchParams(prev => {
      prev.set('sort', sortId);
      return prev;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100">Explore Standings</h1>
        <p className="text-sm text-slate-450 mt-1">Discover community rankings, find hidden gems, and cast votes</p>
      </div>

      {/* Filters & Search Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/25 border border-slate-850 p-4 rounded-xl">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Search titles, descriptions, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button type="submit" className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Sort Select */}
        <div className="flex items-center space-x-2.5">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <select
            value={activeSort}
            onChange={(e) => handleSortSelect(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            {sortOptions.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Pills List */}
      <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategorySelect(cat.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${
              activeCategory === cat.id
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/15'
                : 'bg-slate-900/60 text-slate-450 border-slate-850 hover:text-slate-250 hover:bg-slate-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results Listings grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 bg-slate-900/40 rounded-xl animate-pulse border border-slate-850/50" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12 bg-slate-900/25 border border-slate-850 rounded-xl">
          <p className="text-sm text-rose-400 font-semibold">Error loading listings. Please refresh and try again.</p>
        </div>
      ) : data?.rankings?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.rankings.map((ranking) => (
            <RankingCard key={ranking._id} ranking={ranking} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/25 border border-slate-850 rounded-xl">
          <Library className="w-10 h-10 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No standings found matching these filters.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 pt-4 border-t border-slate-850/80">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading}
            className="p-2 rounded bg-slate-900 border border-slate-850 text-slate-350 hover:text-white disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-semibold text-slate-400">
            Page {data.currentPage} of {data.totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(data.totalPages, prev + 1))}
            disabled={currentPage === data.totalPages || isLoading}
            className="p-2 rounded bg-slate-900 border border-slate-850 text-slate-350 hover:text-white disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Explore;
