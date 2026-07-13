import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ranking from '../models/Ranking.js';
import User from '../models/User.js';

dotenv.config();

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rankverse';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const targetTitles = ['rferbfd', 'erewrw'];

    for (const title of targetTitles) {
      const ranking = await Ranking.findOne({ title });
      if (ranking) {
        console.log(`Found ranking "${title}" with ID ${ranking._id}.`);
        
        // Decrement creator stats if it was published
        if (ranking.status === 'published') {
          const creator = await User.findById(ranking.creator);
          if (creator) {
            creator.stats.rankingsCreated = Math.max(0, creator.stats.rankingsCreated - 1);
            await creator.save();
            console.log(`Decremented stats.rankingsCreated for user "${creator.name}".`);
          }
        }

        // Hard delete the ranking document
        await Ranking.deleteOne({ _id: ranking._id });
        console.log(`Deleted ranking "${title}" successfully.`);
      } else {
        console.log(`Ranking "${title}" not found.`);
      }
    }

    console.log('Deletions complete!');
  } catch (err) {
    console.error('Error during deletion:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
