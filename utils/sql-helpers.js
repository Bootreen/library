const { sql } = require("@vercel/postgres");

const preparePayload = (payload, mandatoryFields, defaultValues) => {
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
  const rejectedRecordsCount = payload.length - approvedPayload.length;

  return { approvedPayload, rejectedRecordsCount };
};

const getGenresIds = async (genres) => {
  const { rows } =
    await sql`SELECT id, name FROM genres WHERE name = ANY(${genres})`;
  // Return object, where genre name is a key and genre id is a value
  // { genre1_name: id1, genre2_name: id2, genre3_name: id3, ... }
  return rows.reduce((map, row) => {
    map[row.name] = row.id;
    return map;
  }, {});
};

// Join id pairs for junction tables
const joinPairs = (approvedPayload, table) => {
  const junctionPairs = [];

  approvedPayload.forEach((record) => {
    if (table === "artists_tracks") {
      const { artists_ids, id: track_id } = record;
      artists_ids.forEach((artist_id) => {
        junctionPairs.push({ artist_id, track_id });
      });
    } else {
      const { id, genres } = record;
      genres.forEach((genre_id) => {
        junctionPairs.push({
          [`${table.split("_")[1].slice(0, -1)}_id`]: id,
          genre_id,
        });
      });
    }
  });

  return junctionPairs;
};

const checkDuplicates = async (
  client,
  tableName,
  uniqueIdArray,
  checkField = null
) => {
  const query = checkField
    ? // Check for duplicates by name field
      `SELECT ${checkField} FROM ${tableName} WHERE ${checkField} = ANY($1::text[])`
    : // Check for duplicates by string hash-id
      (query = `SELECT id FROM ${tableName} WHERE id = ANY($1::text[])`);
  const queryParams = [uniqueIdArray];

  // Query for duplicates
  const check = await client.query(query, queryParams);
  // Return an array of identifiers for all duplicates found
  const result = check.rows.map((row) =>
    checkField ? row[checkField] : row.id
  );

  return result;
};

const prepareInsertQuery = (isJunction, tableName, newRecords, columns) => {
  // Create placeholders for all SQL values ($1, $2, $3, ...), ($n1, $n2, $n3, ...), ...
  const valuesString = newRecords
    .map((_, index) => {
      const baseIndex = index * columns.length + 1;
      const placeholders = columns
        .map((_, i) => `$${baseIndex + i}`)
        .join(", ");
      return `(${placeholders}, CURRENT_TIMESTAMP)`;
    })
    .join(", ");

  // Gather all values for SQL value-placeholders in a saparate array
  const queryParameters = newRecords
    .map((record) => columns.map((column) => record[column]))
    .flat();

  // Duplicates check for junction tables
  const onConflict = isJunction
    ? `ON CONFLICT (${columns.join(", ")}) DO NOTHING`
    : "";

  // Compose SQL-query from header and values placeholders
  const query = `
    INSERT INTO ${tableName} (${columns.join(", ")}, created_at)
    VALUES ${valuesString}
    ${onConflict}
  `;

  return { query, queryParameters };
};

module.exports = {
  preparePayload,
  getGenresIds,
  joinPairs,
  checkDuplicates,
  prepareInsertQuery,
};
