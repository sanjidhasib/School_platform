const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const { startJobs } = require('./jobs/missingHomework.job');
const { resumePending } = require('./services/textbookIngest');
const aiProvider = require('./services/aiProvider');

const startServer = async () => {
  await connectDB();
  
  // Start cron jobs
  startJobs();

  aiProvider.verify();

  // Finish any textbook a restart interrupted mid-processing.
  resumePending().catch((err) => console.error('[textbooks] Resume failed:', err.message));

  const PORT = env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();
