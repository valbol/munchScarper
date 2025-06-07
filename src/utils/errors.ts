export class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export class CrawlingDisallowedError extends HttpError {
  constructor(url: string) {
    super(403, `Crawling disallowed by robots.txt for ${url}`);
    Object.setPrototypeOf(this, CrawlingDisallowedError.prototype);
  }
}
