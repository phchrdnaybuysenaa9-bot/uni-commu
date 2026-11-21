import { createPostStorage } from '../src/community/storage.mjs';
try {
  await createPostStorage().setup();
  console.log('Private unicommu-posts bucket created.');
} catch (error) {
  console.error('Storage setup failed:', error.publicError ?? error.name);
  process.exitCode = 1;
}
