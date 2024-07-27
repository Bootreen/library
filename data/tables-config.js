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
    checkField: "name", // Check for duplicates by name
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
  artists_tracks: {
    tableName: "Artists_tracks",
    mandatoryFields: ["artists_ids", "id"],
    defaultValues: false,
    columns: ["artist_id", "track_id"],
  },
  genres_artists: {
    tableName: "Genres_artists",
    mandatoryFields: ["id", "genres"],
    defaultValues: false,
    columns: ["artist_id", "genre_id"],
  },
  genres_albums: {
    tableName: "Genres_albums",
    mandatoryFields: ["id", "genres"],
    defaultValues: false,
    columns: ["album_id", "genre_id"],
  },
  genres_tracks: {
    tableName: "Genres_tracks",
    mandatoryFields: ["id", "genres"],
    defaultValues: false,
    columns: ["track_id", "genre_id"],
  },
};

module.exports = tablesConfig;
