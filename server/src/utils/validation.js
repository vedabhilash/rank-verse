import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must not exceed 50 characters').trim(),
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const rankingItemSchema = z.object({
  rankNumber: z.number().int().min(1).max(10),
  title: z.string().min(1, 'Item title is required').max(100, 'Title is too long').trim(),
  description: z.string().max(500, 'Description is too long').optional().default(''),
  image: z.object({
    url: z.string().url('Invalid image URL').or(z.string().max(0)).optional().default(''),
    source: z.enum(['upload', 'pexels', 'pixabay', 'ai-generated']).optional().default('upload'),
    publicId: z.string().optional().default(''),
  }).optional(),
});

export const rankingCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title is too long').trim(),
  category: z.string().min(1, 'Category is required').trim(),
  description: z.string().max(1000, 'Description is too long').optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  items: z.array(rankingItemSchema).min(1, 'Ranking must have at least 1 item').max(10, 'Ranking cannot exceed 10 items'),
  isCommunitySourced: z.boolean().optional().default(false),
});
