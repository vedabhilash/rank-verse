import mongoose from 'mongoose';
import assert from 'assert';
import dotenv from 'dotenv';

import User from '../models/User.js';
import Ranking from '../models/Ranking.js';
import Vote from '../models/Vote.js';
import CommunityRankingEntry from '../models/CommunityRankingEntry.js';
import { updateCommunityRankingEntry } from '../services/ranking.service.js';

dotenv.config();

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/rankverse-test';

const runTests = async () => {
  console.log('--- Starting RankVerse Test Suite ---');
  
  try {
    // 1. Establish connection to test database
    await mongoose.connect(TEST_MONGO_URI);
    console.log('Connected to test database.');

    // 2. Clear collections
    await User.deleteMany({});
    await Ranking.deleteMany({});
    await Vote.deleteMany({});
    await CommunityRankingEntry.deleteMany({});
    console.log('Cleared existing test data.');

    // 3. Test Case 1: Auth & User Model Hashing
    console.log('Running Test: Auth & Password Hashing...');
    const userA = await User.create({
      name: 'Tester A',
      email: 'testa@rankverse.com',
      passwordHash: 'password123',
    });
    
    // Check that pre-save hook hashed password
    assert.notStrictEqual(userA.passwordHash, 'password123');
    // Check match password utility
    const isMatch = await userA.matchPassword('password123');
    assert.strictEqual(isMatch, true);
    console.log('✔ Auth test passed successfully.');

    // 4. Test Case 2: One Vote Per Item Constraint
    console.log('Running Test: One-Vote-Per-Item Constraint...');
    
    const ranking = await Ranking.create({
      title: 'Best Sci-Fi Movies',
      category: 'movies',
      creator: userA._id,
      items: [
        { rankNumber: 1, title: 'Inception', voteCount: 0 },
        { rankNumber: 2, title: 'Interstellar', voteCount: 0 },
      ],
    });

    const itemAId = ranking.items[0]._id;

    // Cast first vote
    await Vote.create({
      user: userA._id,
      ranking: ranking._id,
      item: itemAId,
    });

    // Try to cast second vote on same item by same user (should fail due to compound unique index)
    try {
      await Vote.create({
        user: userA._id,
        ranking: ranking._id,
        item: itemAId,
      });
      assert.fail('Should have failed compound unique constraint on second vote');
    } catch (err) {
      assert.strictEqual(err.code, 11000); // duplicate key error code
      console.log('✔ One-vote-per-item unique constraint enforced.');
    }

    // 5. Test Case 3: Community Aggregation Engine (Normalization & Merging)
    console.log('Running Test: Community Ranking Engine Aggregation...');

    const userB = await User.create({
      name: 'Tester B',
      email: 'testb@rankverse.com',
      passwordHash: 'password123',
    });

    // Create a second ranking list with matching normalized title (Inception vs inception)
    const rankingB = await Ranking.create({
      title: 'My Favorite Movie List',
      category: 'movies',
      creator: userB._id,
      items: [
        { rankNumber: 1, title: 'inception', voteCount: 0 }, // lowercase
      ],
    });

    const itemBId = rankingB.items[0]._id;

    // Cast vote from User B on Ranking B's item
    await Vote.create({
      user: userB._id,
      ranking: rankingB._id,
      item: itemBId,
    });

    // Trigger community aggregation calculations for both items
    await updateCommunityRankingEntry('movies', 'Inception');
    await updateCommunityRankingEntry('movies', 'inception');

    // Retrieve aggregated community entry
    const entry = await CommunityRankingEntry.findOne({
      category: 'movies',
      normalizedItemKey: 'inception',
    });

    assert.ok(entry);
    // Votes from User A (1 vote) and User B (1 vote) should merge, summing to 2!
    assert.strictEqual(entry.totalVotes, 2);
    assert.strictEqual(entry.title, 'Inception'); // capital I title is representative
    assert.strictEqual(entry.rankingsIncludedIn.length, 2);
    console.log('✔ Community Ranking Engine aggregates and merges duplicate titles.');

    console.log('\n--- All RankVerse Tests Passed! ---');
  } catch (error) {
    console.error('✖ Test Suite Failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from test database.');
    process.exit(0);
  }
};

runTests();
