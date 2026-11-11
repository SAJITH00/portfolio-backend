const assert = require('node:assert/strict');
const {
  importMissingPortfolioRecords,
  importProfileIfMissing,
} = require('../utils/importMissingPortfolioRecords');

const createModel = (initialRecords = []) => {
  const records = initialRecords.map((record) => ({ ...record }));
  return {
    records,
    async find() {
      return records;
    },
    async create(record) {
      const created = { ...record };
      records.push(created);
      return created;
    },
  };
};

async function run() {
  const projects = createModel([{ title: 'Business Web', description: 'Admin-edited project' }]);
  const fixtures = [
    { title: ' business web ', description: 'Old fixture description' },
    { title: 'ChronoGO', description: 'Legacy project' },
  ];

  const firstRun = await importMissingPortfolioRecords({
    model: projects,
    records: fixtures,
    identityFields: ['title'],
    dryRun: false,
    label: 'project',
  });
  assert.deepEqual(firstRun, { inserted: 1, preserved: 1 });
  assert.equal(projects.records.length, 2);
  assert.equal(projects.records[0].description, 'Admin-edited project');
  assert.equal(projects.records[1].title, 'ChronoGO');

  const secondRun = await importMissingPortfolioRecords({
    model: projects,
    records: fixtures,
    identityFields: ['title'],
    dryRun: false,
    label: 'project',
  });
  assert.deepEqual(secondRun, { inserted: 0, preserved: 2 });
  assert.equal(projects.records.length, 2);

  const dryRunProjects = createModel();
  const dryRunResult = await importMissingPortfolioRecords({
    model: dryRunProjects,
    records: fixtures,
    identityFields: ['title'],
    dryRun: true,
    label: 'project',
  });
  assert.deepEqual(dryRunResult, { inserted: 2, preserved: 0 });
  assert.equal(dryRunProjects.records.length, 0);

  const ambiguous = createModel([{ name: 'React', category: 'Frontend' }, { name: 'react', category: 'frontend' }]);
  await assert.rejects(
    importMissingPortfolioRecords({
      model: ambiguous,
      records: [{ name: 'React', category: 'Frontend' }],
      identityFields: ['name', 'category'],
      dryRun: false,
      label: 'skill',
    }),
    /Ambiguous skill identity/
  );
  assert.equal(ambiguous.records.length, 2);

  const existingProfile = createModel([{ name: 'Admin-edited name' }]);
  const profileResult = await importProfileIfMissing({
    model: existingProfile,
    record: { name: 'Legacy name' },
    dryRun: false,
  });
  assert.deepEqual(profileResult, { inserted: 0, preserved: 1 });
  assert.equal(existingProfile.records[0].name, 'Admin-edited name');

  const emptyProfile = createModel();
  const dryRunProfile = await importProfileIfMissing({
    model: emptyProfile,
    record: { name: 'Legacy name' },
    dryRun: true,
  });
  assert.deepEqual(dryRunProfile, { inserted: 1, preserved: 0 });
  assert.equal(emptyProfile.records.length, 0);

  console.log('Portfolio import tests passed: idempotency, preservation, ambiguity guard, and dry run.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
