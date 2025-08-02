import mongoose from "mongoose";

const connectDatabase = async () => {
  const maxRetries = 3;
  let retryCount = 0;

  const connectWithRetry = async (connectionUrl = process.env.DB_URL) => {
    try {
      console.log(`🔄 Attempting MongoDB connection (attempt ${retryCount + 1}/${maxRetries})...`);
      console.log(`🔗 Using connection URL: ${connectionUrl.replace(/:[^:@]*@/, ':***@')}`);
      
      const conn = await mongoose.connect(connectionUrl, {
        serverSelectionTimeoutMS: 10000, // Increased timeout to 10s
        socketTimeoutMS: 45000,
        family: 4, // Force IPv4
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
        retryWrites: true,
        w: 'majority'
      });

      console.log(`✅ MongoDB connected successfully to: ${conn.connection.host}`);
      return conn;

    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${retryCount + 1} failed:`, error.message);
      
      retryCount++;
      
      // Try backup URL on second attempt
      if (retryCount === 2 && process.env.DB_URL_BACKUP && connectionUrl === process.env.DB_URL) {
        console.log(`🔄 Trying backup connection URL...`);
        return connectWithRetry(process.env.DB_URL_BACKUP);
      }
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying connection in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return connectWithRetry(connectionUrl);
      } else {
        console.error("💥 All MongoDB connection attempts failed. Please check:");
        console.error("   1. Internet connection");
        console.error("   2. MongoDB Atlas cluster status");
        console.error("   3. Database URL and credentials");
        console.error("   4. Network firewall settings");
        console.error("   5. DNS resolution for cluster0.sc1cx.mongodb.net");
        throw error;
      }
    }
  };

  return connectWithRetry();
};

export default connectDatabase;