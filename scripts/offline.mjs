// Simulates "network off" for a build, to prove the snapshot fallback:
//   NODE_OPTIONS="--import ./scripts/offline.mjs" npm run build
globalThis.fetch = async () => { throw new TypeError('fetch failed (network off simulation)'); };
