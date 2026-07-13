import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import Ranking from '../models/Ranking.js';
import User from '../models/User.js';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ARTIFACT_DIR = 'C:/Users/vedab/.gemini/antigravity-ide/brain/fe8b5505-30e9-45da-b520-248bb826bee5';

const findImageFile = (prefix) => {
  const files = fs.readdirSync(ARTIFACT_DIR);
  const match = files.find(f => f.startsWith(prefix) && f.endsWith('.png'));
  return match ? path.join(ARTIFACT_DIR, match) : null;
};

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rankverse';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Find the first user in the database
    const creator = await User.findOne({});
    if (!creator) {
      console.error('No users found in database! Please register a user first.');
      process.exit(1);
    }
    console.log(`Using user "${creator.name}" (${creator._id}) as list creator.`);

    const seriesList = [
      {
        rankNumber: 1,
        title: "Breaking Bad",
        description: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.",
        prefix: "breaking_bad_graphic",
      },
      {
        rankNumber: 2,
        title: "The Wire",
        description: "The Baltimore drug scene, as seen through the eyes of drug dealers and law enforcement, portraying societal systems and challenges.",
        prefix: "the_wire_graphic",
      },
      {
        rankNumber: 3,
        title: "The Sopranos",
        description: "New Jersey mob boss Tony Soprano deals with personal and professional issues in his home and business life, visiting a therapist.",
        prefix: "the_sopranos_graphic",
      },
      {
        rankNumber: 4,
        title: "Sherlock",
        description: "A modern update finds the famous sleuth Sherlock Holmes and his doctor partner John Watson solving crimes in 21st century London.",
        prefix: "sherlock_graphic",
      },
      {
        rankNumber: 5,
        title: "Mindhunter",
        description: "In the late 1970s, two FBI agents expand criminal science by delving into the psychology of murder and interviewing serial killers.",
        prefix: "mindhunter_graphic",
      },
    ];

    const rankingItems = [];

    for (const series of seriesList) {
      const filePath = findImageFile(series.prefix);
      if (!filePath) {
        throw new Error(`Could not find generated image file for prefix "${series.prefix}"`);
      }
      console.log(`Uploading ${filePath} to Cloudinary...`);
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        folder: 'rankverse_crime',
      });
      console.log(`Uploaded successfully: ${uploadResult.secure_url}`);

      rankingItems.push({
        rankNumber: series.rankNumber,
        title: series.title,
        description: series.description,
        image: {
          url: uploadResult.secure_url,
          source: 'upload',
          publicId: uploadResult.public_id,
        },
      });
    }

    const newRanking = await Ranking.create({
      title: 'Top Crime TV Series of All Time',
      category: 'entertainment',
      description: 'A curated list of the absolute best crime, mystery, and detective television dramas ever produced.',
      tags: ['Crime', 'TV Series', 'Mystery', 'Drama', 'Thriller'],
      creator: creator._id,
      items: rankingItems,
      isCommunitySourced: true,
      isFeatured: true,
      status: 'published',
    });

    console.log(`Ranking created successfully! ID: ${newRanking._id}`);

    // Increment user creator stats
    creator.stats.rankingsCreated += 1;
    await creator.save();
    console.log(`Updated creator stats.`);

  } catch (err) {
    console.error('Error creating ranking:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
