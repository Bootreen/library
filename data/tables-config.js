const tablesConfig = {
  artists: {
    tableName: "Artists",
    mandatoryFields: ["id", "name", "image_url"],
    defaultValues: { popularity: 0, genres: [] },
    columns: ["id", "name", "popularity", "genres", "image_url"],
  },
  albums: {
    tableName: "Albums",
    mandatoryFields: ["id", "name", "image_url"],
    defaultValues: { releaseDate: "", popularity: 0, genres: [] },
    columns: [
      "id",
      "name",
      "release_date",
      "popularity",
      "genres",
      "image_url",
    ],
  },
  genres: {
    tableName: "Genres",
    mandatoryFields: ["name"],
    defaultValues: { description: "" },
    columns: ["name", "description"],
    nameField: "name", // Check for duplicates by name
  },
  tracks: {
    tableName: "Tracks",
    mandatoryFields: ["id", "name", "album", "album_id", "duration_ms"],
    defaultValues: {
      popularity: 0,
      genres: [],
      danceability: 0,
      energy: 0,
      mode: false,
      key: 0,
      valence: 0,
    },
    columns: [
      "id",
      "name",
      "album",
      "album_id",
      "genres",
      "duration_ms",
      "popularity",
      "danceability",
      "energy",
      "mode",
      "key",
      "valence",
    ],
  },
};

module.exports = tablesConfig;
