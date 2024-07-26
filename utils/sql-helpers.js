const preparePayload = (payload, mandatoryFields, defaultValues) => {
  const rejectedRecordsCount = payload.filter((record) =>
    mandatoryFields.some((field) => {
      console.log(
        record[field],
        Array.isArray(record[field]) && record[field].length === 0
      );
      return (
        // If mandatory is missed
        !record[field] ||
        // Or mandatory field present, but it's an empty array
        // (equals to missed mandatory field)
        (Array.isArray(record[field]) && record[field].length === 0)
      );
    })
  ).length;
  const approvedPayload = payload
    .filter((record) =>
      mandatoryFields.every(
        (field) =>
          // Filter proper mandatory fields
          (record[field] && !Array.isArray(record[field])) ||
          // If this is an array it has to contain at least one record
          (Array.isArray(record[field]) && record[field].length > 0)
      )
    )
    .map((record) =>
      !defaultValues
        ? record
        : // Fill defaultValues for the primary tables only
          // Junction doesn't have ones
          {
            ...defaultValues,
            ...record,
          }
    );

  return { approvedPayload, rejectedRecordsCount };
};

const joinPairs = (approvedPayload) => {
  const junctionPairs = [];

  for (const { id: track_id, artists_ids } of approvedPayload)
    for (const artist_id of artists_ids)
      junctionPairs.push({ artist_id: artist_id, track_id: track_id });

  return junctionPairs;
};

const checkDuplicates = async (
  client,
  tableName,
  uniqueIdArray,
  checkField = null
) => {
  let query;
  const queryParams = [uniqueIdArray];

  if (checkField) {
    // Check for duplicates by name field
    query = `SELECT ${checkField} FROM ${tableName} WHERE ${checkField} = ANY($1::text[])`;
  } else {
    // Check for duplicates by string hash-id
    query = `SELECT id FROM ${tableName} WHERE id = ANY($1::text[])`;
  }

  const check = await client.query(query, queryParams);
  const result = check.rows.map((row) =>
    checkField ? row[checkField] : row.id
  );

  return result;
};

const prepareInsertQuery = (isJunction, tableName, newRecords, columns) => {
  let valuesString = newRecords
    .map((_, index) => {
      const baseIndex = index * columns.length + 1;
      const placeholders = columns
        .map((_, i) => `$${baseIndex + i}`)
        .join(", ");
      return `(${placeholders}, CURRENT_TIMESTAMP)`;
    })
    .join(", ");

  const queryParameters = newRecords
    .map((record) => columns.map((column) => record[column]))
    .flat();

  // Duplicates check for junction tables
  const onConflict = isJunction
    ? `ON CONFLICT (${columns.join(", ")}) DO NOTHING`
    : "";

  const query = `
    INSERT INTO ${tableName} (${columns.join(", ")}, created_at)
    VALUES ${valuesString}
    ${onConflict}
  `;

  return { query, queryParameters };
};

module.exports = {
  preparePayload,
  joinPairs,
  checkDuplicates,
  prepareInsertQuery,
};
