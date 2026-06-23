export const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({ error: "Sorry, can't find that" });
};

export const errorHandler = (err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message });
};