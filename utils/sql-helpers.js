const filterAndPreparePayload = (payload, mandatoryFields, defaultValues) => {
  const rejectedRecordsCount = payload.filter((record) =>
    mandatoryFields.some((field) => !record[field])
  ).length;

  const approvedPayload = payload
    .filter((record) => mandatoryFields.every((field) => record[field]))
    .map((record) => ({
      ...defaultValues,
      ...record,
    }));

  return { approvedPayload, rejectedRecordsCount };
};

const checkDuplicates = async (
  client,
  tableName,
  uniqueIdArray,
  checkField = null
) => {
  let query;
  let queryParams;

  if (checkField) {
    // Check for duplicates by name field
    query = `SELECT ${checkField} FROM ${tableName} WHERE ${checkField} = ANY($1::text[])`;
    queryParams = [uniqueIdArray];
  } else {
    // Check for duplicates by id
    query = `SELECT id FROM ${tableName} WHERE id = ANY($1::text[])`;
    queryParams = [uniqueIdArray];
  }

  const result = await client.query(query, queryParams);
  return result.rows.map((row) => (checkField ? row[checkField] : row.id));
};

const prepareInsertQuery = (tableName, newRecords, columns) => {
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

  const query = `
    INSERT INTO ${tableName} (${columns.join(", ")}, created_at)
    VALUES ${valuesString}
  `;

  return { query, queryParameters };
};

module.exports = {
  filterAndPreparePayload,
  checkDuplicates,
  prepareInsertQuery,
};
