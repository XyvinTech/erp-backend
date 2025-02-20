const expressLoader = require('./express');
const mongooseLoader = require('./mongoose');

module.exports = async ({ app }) => {
  // Load database
  await mongooseLoader();
  console.log('✅ Database loaded');

  // Load express middleware and routes
  await expressLoader({ app });
  console.log('✅ Express loaded');
}; 