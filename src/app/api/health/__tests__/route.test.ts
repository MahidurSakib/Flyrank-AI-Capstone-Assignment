import { describe, expect, it } from "vitest";
import { GET } from "../route";

describe("GET /api/health", () => {
  it("returns a 200 with the expected shape", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({
      status: "ok",
      service: "ai-study-assistant",
    });
    expect(typeof body.timestamp).toBe("string");
  });

  it("returns a valid, current ISO timestamp", async () => {
    const before = Date.now();
    const response = await GET();
    const body = await response.json();
    const after = Date.now();

    const timestampMs = new Date(body.timestamp).getTime();
    expect(timestampMs).toBeGreaterThanOrEqual(before);
    expect(timestampMs).toBeLessThanOrEqual(after);
  });
});
