const normalizeIdentityValue = (value) => String(value ?? '').trim().toLowerCase();

const importMissingPortfolioRecords = async ({
  model,
  records,
  identityFields,
  dryRun,
  label,
}) => {
  const existingRecords = await model.find({});
  const knownRecords = [...existingRecords];
  let inserted = 0;
  let preserved = 0;

  for (const record of records) {
    const matches = knownRecords.filter((existing) => identityFields.every(
      (field) => normalizeIdentityValue(existing[field]) === normalizeIdentityValue(record[field])
    ));

    if (matches.length > 1) {
      throw new Error(`Ambiguous ${label} identity in database; no ${label} records were changed.`);
    }

    if (matches.length === 1) {
      preserved++;
      continue;
    }

    if (dryRun) {
      knownRecords.push(record);
    } else {
      knownRecords.push(await model.create(record));
    }
    inserted++;
  }

  return { inserted, preserved };
};

const importProfileIfMissing = async ({ model, record, dryRun }) => {
  const existingRecords = await model.find({});
  if (existingRecords.length > 1) {
    throw new Error('Ambiguous profile state: multiple profiles exist; no profile was changed.');
  }
  if (existingRecords.length === 1) {
    return { inserted: 0, preserved: 1 };
  }
  if (!dryRun) await model.create(record);
  return { inserted: 1, preserved: 0 };
};

module.exports = {
  importMissingPortfolioRecords,
  importProfileIfMissing,
};
