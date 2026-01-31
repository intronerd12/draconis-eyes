const cloudinary = require('cloudinary').v2;

// Function to configure Cloudinary (called after env vars are loaded)
const configureCloudinary = () => {
    const config = {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    };

    console.log('Cloudinary config:', {
        cloud_name: config.cloud_name ? 'SET' : 'NOT SET',
        api_key: config.api_key ? 'SET' : 'NOT SET',
        api_secret: config.api_secret ? 'SET' : 'NOT SET'
    });

    cloudinary.config(config);
    return cloudinary;
};

// Configure immediately if env vars are available
if (process.env.CLOUDINARY_CLOUD_NAME) {
    configureCloudinary();
}

module.exports = { cloudinary, configureCloudinary };