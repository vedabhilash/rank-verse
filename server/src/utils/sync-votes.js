import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ranking from '../models/Ranking.js';
import Vote from '../models/Vote.js';

dotenv.config();

const sync = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rankverse';
    await mongoose.connect(mongoUri);
    console.log('Connected to database.');

    const rankings = await Ranking.find({});
    console.log(`Found ${rankings.length} rankings to process.`);

    for (const ranking of rankings) {
      let modified = false;
      for (const item of ranking.items) {
        const actualVotes = await Vote.countDocuments({ ranking: ranking._id, item: item._id });
        if (item.voteCount !== actualVotes) {
          console.log(`Syncing item "${item.title}": changing voteCount from ${item.voteCount} to ${actualVotes}`);
          item.voteCount = actualVotes;
          modified = true;
        }
      }
      if (modified) {
        await ranking.save();
        console.log(`Updated ranking "${ranking.title}".`);
      }
    }

    console.log('Vote synchronization complete!');
  } catch (err) {
    console.error('Error during synchronization:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

sync();
