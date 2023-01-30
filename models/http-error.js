class HTTPError extends Error {
  constructor(message, errorCode) {
    super(message); // Add "message" property
    this.code = errorCode; // Add "message" property
  }
}

module.exports = HTTPError;
