export const isSyntaxError = (type, payload) => {
  if ((type = "user")) {
    const [name] = payload;
    const hasError =
      !name || typeof name !== "string" || name.trim() === "" ? true : false;
    return hasError;
  }
};
