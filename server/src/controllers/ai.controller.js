import { describeImage, generateImage } from '../services/ai.service.js';

// @desc    Describe image details and generate tags
// @route   POST /api/v1/ai/describe-image
// @access  Private
export const describeImageController = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      res.status(400);
      return next(new Error('Image URL is required'));
    }

    const analysis = await describeImage(imageUrl);
    res.status(200).json({
      success: true,
      description: analysis.description,
      tags: analysis.tags,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate image + description + tags
// @route   POST /api/v1/ai/generate-image
// @access  Private
export const generateImageController = async (req, res, next) => {
  try {
    const { title, category } = req.body;
    if (!title || !category) {
      res.status(400);
      return next(new Error('Title and Category are required'));
    }

    const result = await generateImage(title, category);
    res.status(200).json({
      success: true,
      imageUrl: result.imageUrl,
      description: result.description,
      tags: result.tags,
    });
  } catch (error) {
    next(error);
  }
};
