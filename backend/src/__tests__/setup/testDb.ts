import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { invalidateAllTaxonomyCaches } from '../../services/taxonomyCache';

let mongoServer: MongoMemoryServer;

/**
 * Connect to MongoDB Memory Server before all tests
 */
beforeAll(async () => {
  // Close any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Create and start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
});

/**
 * Clear all collections after each test
 */
afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
  // El cache in-memory de taxonomías persiste entre specs si no lo limpiamos:
  // un spec que hace Brand.create(...) directo no pasa por el admin controller,
  // así que el cache del spec anterior (posiblemente vacío) se le entrega como
  // verdad y los populates virtuales devuelven null.
  invalidateAllTaxonomyCaches();
});

/**
 * Disconnect and stop MongoDB Memory Server after all tests
 */
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
});
