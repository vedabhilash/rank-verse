import axios from 'axios';
import cloudinary from '../config/cloudinary.js';

// Search free images from Pexels (primary) or Pixabay (fallback)
export const searchImages = async (query) => {
  const limit = 15;
  const pexelsKey = process.env.PEXELS_API_KEY;
  const pixabayKey = process.env.PIXABAY_API_KEY;

  let results = [];

  // 1. Try Pexels first
  if (pexelsKey && pexelsKey !== 'dummy_pexels_key') {
    try {
      console.log(`Searching Pexels for: ${query}`);
      const response = await axios.get('https://api.pexels.com/v1/search', {
        headers: { Authorization: pexelsKey },
        params: { query, per_page: limit },
        timeout: 5000,
      });

      if (response.data && response.data.photos && response.data.photos.length > 0) {
        results = response.data.photos.map((photo) => ({
          url: photo.src.large,
          thumbnailUrl: photo.src.medium,
          photographer: photo.photographer,
          source: 'pexels',
        }));
        return results;
      }
    } catch (error) {
      console.error('Pexels API Error, falling back to Pixabay:', error.message);
    }
  }

  // 2. Fallback to Pixabay
  if (pixabayKey && pixabayKey !== 'dummy_pixabay_key') {
    try {
      console.log(`Searching Pixabay for: ${query}`);
      const response = await axios.get('https://pixabay.com/api/', {
        params: {
          key: pixabayKey,
          q: encodeURIComponent(query),
          per_page: limit,
        },
        timeout: 5000,
      });

      if (response.data && response.data.hits && response.data.hits.length > 0) {
        results = response.data.hits.map((hit) => ({
          url: hit.largeImageURL,
          thumbnailUrl: hit.webformatURL,
          photographer: hit.user,
          source: 'pixabay',
        }));
        return results;
      }
    } catch (error) {
      console.error('Pixabay API Error:', error.message);
    }
  }

  // If both fail or have dummy keys, return placeholder results to make local development playable
  console.log('No keys or search failed. Returning fallback placeholder images.');
  const categories = ['nature', 'tech', 'city', 'food', 'travel', 'people'];
  const placeholderQuery = categories.includes(query.toLowerCase()) ? query : 'nature';
  
  return Array.from({ length: 6 }).map((_, i) => ({
    url: `https://images.unsplash.com/photo-${1500000000000 + i * 100000}?w=800&auto=format&fit=crop&q=60`,
    thumbnailUrl: `https://images.unsplash.com/photo-${1500000000000 + i * 100000}?w=400&auto=format&fit=crop&q=60`,
    photographer: 'Unsplash contributor',
    source: 'placeholder',
  }));
};

// Upload file buffer to Cloudinary
export const uploadToCloudinary = (fileBuffer, folder = 'rankverse') => {
  return new Promise((resolve, reject) => {
    // If keys are dummy, return a mock response to make it work without Cloudinary setup
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'dummy_cloud') {
      console.log('Using dummy Cloudinary credentials, return mock response');
      return resolve({
        url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
        publicId: `mock_public_id_${Date.now()}`,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};
