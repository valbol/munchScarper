import { scraper } from "../src/utils/scraper";
import puppeteer from "puppeteer";
import { Summary } from "../src/types/summary";

describe("scraper", () => {
  let browserMock: any;
  let pageMock: any;

  beforeAll(() => {
    // Mock Puppeteer launch to return a browser stub
    pageMock = {
      setUserAgent: jest.fn(),
      goto: jest.fn(),
      evaluate: jest.fn().mockResolvedValue({
        metadata: {
          title: "Test Title",
          description: "Test Description",
          keywords: ["a", "b"],
          author: "Author Name",
          publishedAt: "2025-01-01T00:00:00Z",
          readTimeMinutes: 1,
        },
        headings: { h1: ["H1"], h2: ["H2"], h3: [] },
        leadParagraphs: ["Lead paragraph."],
        topLinks: [{ text: "Link", href: "https://link" }],
        topImages: [{ src: "https://img", alt: "Alt" }],
      }),
    };
    browserMock = {
      newPage: jest.fn().mockResolvedValue(pageMock),
      close: jest.fn(),
    };

    jest.spyOn(puppeteer, "launch").mockResolvedValue(browserMock as any);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should return a valid Summary object", async () => {
    const url = "https://example.com";
    const result: Summary = await scraper(url);

    expect(puppeteer.launch).toHaveBeenCalled();
    expect(pageMock.setUserAgent).toHaveBeenCalledWith("ValScraperBot/1.0");
    expect(pageMock.goto).toHaveBeenCalledWith(url, expect.any(Object));

    // Validate structure
    expect(result.metadata.title).toBe("Test Title");
    expect(result.headings.h1).toEqual(["H1"]);
    expect(result.leadParagraphs).toEqual(["Lead paragraph."]);
    expect(result.topLinks).toEqual([{ text: "Link", href: "https://link" }]);
    expect(result.topImages).toEqual([{ src: "https://img", alt: "Alt" }]);
  });
});
