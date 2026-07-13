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

    const moments = [
      {
        rankNumber: 1,
        title: "Maradona's Goal of the Century (1986)",
        description: "Diego Maradona's sensational 60-meter solo run dribbling past five English players in the 1986 World Cup quarter-finals.",
        prefix: "maradona_goal_century",
      },
      {
        rankNumber: 2,
        title: "Pele's 1958 World Cup Debut",
        description: "A 17-year-old Pelé wowed the globe, scoring a brilliant hat-trick in the semi-finals and a brace in the final to win Brazil's first title.",
        prefix: "pele_1958_debut",
      },
      {
        rankNumber: 3,
        title: "Zidane's Volley in UCL Final (2002)",
        description: "Zinedine Zidane's magnificent left-foot volley from the edge of the box against Bayer Leverkusen to win Real Madrid the Champions League.",
        prefix: "zidane_ucl_volley",
      },
      {
        rankNumber: 4,
        title: "Messi's First Ballon d'Or (2009)",
        description: "Lionel Messi clinching his first-ever Ballon d'Or trophy after leading Barcelona to a historic continental treble, starting a legendary era.",
        prefix: "messi_first_ballon",
      },
      {
        rankNumber: 5,
        title: "Ronaldo's Bicycle Kick vs Juventus (2018)",
        description: "Cristiano Ronaldo's jaw-dropping, gravity-defying overhead kick in the Champions League quarter-finals that drew applause from Juventus fans.",
        prefix: "ronaldo_bicycle_kick",
      },
    ];

    const rankingItems = [];

    for (const moment of moments) {
      const filePath = findImageFile(moment.prefix);
      if (!filePath) {
        throw new Error(`Could not find generated image file for prefix "${moment.prefix}"`);
      }
      console.log(`Uploading ${filePath} to Cloudinary...`);
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        folder: 'rankverse_fifa',
      });
      console.log(`Uploaded successfully: ${uploadResult.secure_url}`);

      rankingItems.push({
        rankNumber: moment.rankNumber,
        title: moment.title,
        description: moment.description,
        image: {
          url: uploadResult.secure_url,
          source: 'upload',
          publicId: uploadResult.public_id,
        },
      });
    }

    const newRanking = await Ranking.create({
      title: 'Best FIFA Moments of All Time',
      category: 'sports',
      description: 'A curated ranking of the most iconic, gravity-defying, and legendary moments in football history.',
      tags: ['FIFA', 'Football', 'Soccer', 'Legends', 'World Cup'],
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
