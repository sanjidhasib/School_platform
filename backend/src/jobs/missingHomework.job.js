const cron = require('node-cron');
const { detectMissingHomework } = require('../services/homeworkService');

const startJobs = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('Running missing homework detection job...');
    try {
      const missingCount = await detectMissingHomework();
      console.log(`Detected missing homeworks for ${missingCount} students`);
    } catch (error) {
      console.error('Error running missing homework job:', error);
    }
  });
};

module.exports = { startJobs };
