const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CommunityPost = require('./models/CommunityPost');

const path = require('path');
const envPath = path.join(__dirname, 'config', '.env');
console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    // Create a dummy post
    console.log('Creating dummy post...');
    const dummy = await CommunityPost.create({
      authorName: 'Debug User',
      text: 'This is a debug post for deletion test',
      source: 'debug_script'
    });
    console.log('Created dummy post:', dummy._id);

    // Try to find it
    const found = await CommunityPost.findById(dummy._id);
    if (found) {
      console.log('Found dummy post. Deleting...');
      
      // Simulate controller logic
      const result = await CommunityPost.deleteOne({ _id: found._id });
      console.log('Delete result:', result);
      
      if (result.deletedCount === 0) {
        console.log('deleteOne failed. Trying fallback...');
        const fallback = await CommunityPost.findByIdAndDelete(found._id);
        console.log('Fallback result:', fallback ? 'Success' : 'Failed');
      } else {
        console.log('deleteOne succeeded.');
      }

      // Verify deletion
      const check = await CommunityPost.findById(dummy._id);
      console.log('Verification check (should be null):', check);
    } else {
      console.log('Could not find dummy post immediately after creation.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
