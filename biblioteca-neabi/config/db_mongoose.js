require('./loadEnv');
const mongoose = require('mongoose');

mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/biblioteca_neabi';
let connectionStatus = 'disconnected';

async function connectMongo() {
  connectionStatus = 'connecting';
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT || 5000),
    });
    connectionStatus = 'connected';
    return mongoose.connection;
  } catch (error) {
    connectionStatus = 'error';
    throw error;
  }
}

async function disconnectMongo() {
  await mongoose.disconnect();
  connectionStatus = 'disconnected';
}

function getMongoStatus() {
  return connectionStatus;
}

module.exports = {
  mongoose,
  connectMongo,
  disconnectMongo,
  getMongoStatus,
};
