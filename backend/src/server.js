const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const { startJobs } = require('./jobs/missingHomework.job');
const { resumePending } = require('./services/textbookIngest');
const aiProvider = require('./services/aiProvider');

const startServer = async () => {
  await connectDB();

  const PORT = env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);

    // Background work starts only once this copy owns the port, so a second
    // copy that can't start never runs the jobs twice.
    startJobs();
    aiProvider.verify();
    // Finish any textbook a restart interrupted mid-processing.
    resumePending().catch((err) => console.error('[textbooks] Resume failed:', err.message));
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `\nPort ${PORT} is already in use — the SchoolOS backend (or another program) is already running.\n` +
        `Use the one that's running, or stop it first:\n` +
        `  Windows:  netstat -ano | findstr :${PORT}   then   taskkill /PID <number> /F\n` +
        `Or give this copy another port with PORT=5001 in backend/.env.\n`
      );
    } else {
      console.error(`Could not start the server: ${err.message}`);
    }
    process.exit(1);
  });
};

startServer();
