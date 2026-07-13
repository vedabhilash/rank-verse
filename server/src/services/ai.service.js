import genAI from '../config/gemini.js';
import axios from 'axios';
import { searchImages } from './image.service.js';

// Convert image URL to Gemini-compatible generative part object
async function urlToGenerativePart(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    return {
      inlineData: {
        data: Buffer.from(response.data).toString('base64'),
        mimeType,
      },
    };
  } catch (error) {
    console.error('Failed to convert image url to generative part:', error.message);
    throw new Error('Could not download image for analysis.');
  }
}

// AI Service: Describe Image
export const describeImage = async (imageUrl) => {
  const geminiKey = process.env.GEMINI_API_KEY;

  // Fallback if no real Gemini Key is available
  if (!geminiKey || geminiKey === 'dummy_gemini_key') {
    console.log('Using dummy Gemini key. Returning mock description & tags.');
    return {
      description: 'An engaging, high-quality image representing the ranking item.',
      tags: ['ranking', 'verse', 'community', 'spotlight'],
    };
  }

  try {
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: { responseMimeType: "application/json" }
    });

    const imagePart = await urlToGenerativePart(imageUrl);
    const prompt = `Describe this image in one engaging sentence suitable for a ranking list item, and suggest 3-5 relevant tags.
    Return JSON format: { "description": "Engaging description text", "tags": ["tag1", "tag2", "tag3"] }`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON safely
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Gemini returned invalid JSON, attempting cleanup:', text);
      // Clean markdown code blocks if any
      const cleanedText = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanedText);
    }
  } catch (error) {
    console.error('Gemini describeImage Error:', error.message);
    // Safe fallback
    return {
      description: 'A beautiful visual matching the top ranking details.',
      tags: ['curated', 'popular', 'top10'],
    };
  }
};

// AI Service: Generate Image (Pluggable)
// Using Stability AI / OpenAI / Mock
export const generateImage = async (title, category) => {
  const providerKey = process.env.AI_IMAGE_PROVIDER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  
  let imageUrl = '';
  let description = '';
  let tags = [];

  // 1. Generate description and tags first (using Gemini or fallback)
  if (geminiKey && geminiKey !== 'dummy_gemini_key') {
    try {
      const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
      });
      const prompt = `Based on the item title "${title}" in the ranking category "${category}", write an engaging, concise description (max 1 sentence) and suggest 3-5 tags.
      Return JSON: { "description": "Engaging description", "tags": ["tag1", "tag2"] }`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const parsed = JSON.parse(response.text().replace(/```json|```/g, '').trim());
      description = parsed.description;
      tags = parsed.tags;
    } catch (err) {
      console.error('Gemini text generation failed, using mock:', err.message);
      description = `Highlighting "${title}", a popular entry in the ${category} category.`;
      tags = [category.toLowerCase(), 'featured', 'rankverse'];
    }
  } else {
    description = `Highlighting "${title}", a popular entry in the ${category} category.`;
    tags = [category.toLowerCase(), 'featured', 'rankverse'];
  }

  // 2. Generate Image (Pluggable Provider)
  if (providerKey && providerKey !== 'dummy_image_gen_key') {
    // Example: Stable Diffusion / Stability AI API
    try {
      console.log(`Generating AI Image via Stability API for: ${title}`);
      const response = await axios.post(
        'https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image',
        {
          text_prompts: [
            { text: `High quality, cinematic photo of ${title}, category ${category}, trending, 4k`, weight: 1 },
          ],
          cfg_scale: 7,
          height: 512,
          width: 512,
          samples: 1,
          steps: 30,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${providerKey}`,
          },
          timeout: 15000,
        }
      );

      if (response.data && response.data.artifacts && response.data.artifacts[0]) {
        const base64Data = response.data.artifacts[0].base64;
        // Upload base64 to Cloudinary
        const uploadResult = await uploadBase64ToCloudinary(`data:image/png;base64,${base64Data}`);
        imageUrl = uploadResult.url;
      }
    } catch (error) {
      console.error('Stability AI generation failed, falling back to mock search:', error.message);
    }
  }

  // If no provider key or AI generation failed, fetch a matching image from Pexels/Pixabay to look authentic
  if (!imageUrl) {
    try {
      console.log(`Using mock AI Image Generation. Searching Pexels for "${title}"`);
      let searchResults = await searchImages(title);
      
      // Fallback to title + category if title alone returned nothing
      if (!searchResults || searchResults.length === 0) {
        searchResults = await searchImages(`${title} ${category}`);
      }

      if (searchResults && searchResults.length > 0) {
        imageUrl = searchResults[0].url;
      }
    } catch (error) {
      console.error('Mock search failed, using default placeholder:', error.message);
    }
  }

  // Final emergency fallback if search returns empty
  if (!imageUrl) {
    imageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
  }

  return {
    imageUrl,
    description,
    tags,
  };
};

// Internal utility to upload base64 directly to Cloudinary (used in Stability API integration)
const uploadBase64ToCloudinary = async (base64String) => {
  const cloudinaryUrl = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudinaryUrl || cloudinaryUrl === 'dummy_cloud') {
    return {
      url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
      publicId: `mock_ai_${Date.now()}`,
    };
  }
  
  const { v2: cloudinary } = await import('cloudinary');
  const result = await cloudinary.uploader.upload(base64String, {
    folder: 'ai_generated',
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};
