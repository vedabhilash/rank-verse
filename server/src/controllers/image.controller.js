import { searchImages, uploadToCloudinary } from '../services/image.service.js';

// @desc    Search stock images (Pexels / Pixabay)
// @route   GET /api/v1/images/search
// @access  Private
export const searchImagesController = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      res.status(400);
      return next(new Error('Search query is required'));
    }

    const images = await searchImages(query);
    res.status(200).json({
      success: true,
      count: images.length,
      images,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload an image
// @route   POST /api/v1/images/upload
// @access  Private
export const uploadImageController = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      return next(new Error('No file uploaded'));
    }

    // Upload buffer to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer);

    res.status(200).json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    next(error);
  }
};
