import mongoose from 'mongoose';

function transactionsUnsupported(err) {
  return err?.code === 20 || /Transaction numbers are only allowed|replica set/i.test(err?.message || '');
}

/**
 * Runs `work(session)` inside a MongoDB transaction (Atlas clusters are replica sets, so this is the normal path).
 * On a local standalone mongod, transactions are unavailable; `work(null)` then runs without one and is
 * expected to compensate on failure itself.
 */
export async function runInTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (err) {
    if (transactionsUnsupported(err)) {
      console.warn('⚠ Transactions are not supported by this MongoDB server — running without one.');
      return work(null);
    }
    throw err;
  } finally {
    await session.endSession();
  }
}
