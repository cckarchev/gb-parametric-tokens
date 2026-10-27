import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_BODY_FONT_ID,
  findFontEntry,
  fontFilePath,
} from "@/core/token/text/fontCatalog";

vi.mock("opentype.js", () => ({
  default: { parse: vi.fn((buffer: ArrayBuffer) => ({ parsedFrom: buffer })) },
}));

// Any bytes do: opentype.js' parse is mocked above.
const FONT_BYTE_LENGTH = 8;

const okResponse = (): Response =>
  new Response(new ArrayBuffer(FONT_BYTE_LENGTH), { status: 200 });

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.resetModules();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("loadCatalogFont", () => {
  it("fetches the file of the font the id names", async () => {
    const { loadCatalogFont } = await import("./loadFont");
    const bodyEntry = findFontEntry(DEFAULT_BODY_FONT_ID);

    fetchMock.mockResolvedValue(okResponse());

    await loadCatalogFont(DEFAULT_BODY_FONT_ID);

    expect(fetchMock).toHaveBeenCalledWith(fontFilePath(bodyEntry.file));
  });

  it("loads each font once, however many tokens ask for it", async () => {
    const { loadCatalogFont } = await import("./loadFont");

    fetchMock.mockResolvedValue(okResponse());

    const [first, second] = await Promise.all([
      loadCatalogFont(DEFAULT_BODY_FONT_ID),
      loadCatalogFont(DEFAULT_BODY_FONT_ID),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it("tries a font again after a failed load instead of failing every later request", async () => {
    const { loadCatalogFont } = await import("./loadFont");

    fetchMock
      .mockResolvedValueOnce(
        new Response(null, { status: 404, statusText: "Not Found" }),
      )
      .mockResolvedValueOnce(okResponse());

    await expect(loadCatalogFont(DEFAULT_BODY_FONT_ID)).rejects.toThrow(
      "Not Found",
    );
    await expect(loadCatalogFont(DEFAULT_BODY_FONT_ID)).resolves.toBeDefined();
  });
});
