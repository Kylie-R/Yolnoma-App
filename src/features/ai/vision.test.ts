import { describe, expect, it } from "vitest";
import { bytesToDataUrl, isVisionModel, validateVisionImage } from "./vision";

describe("AI Chat vision helpers", () => {
  it("converts image bytes to a data URL", () => {
    expect(bytesToDataUrl(new Uint8Array([65, 66]), "image/png")).toBe(
      "data:image/png;base64,QUI=",
    );
  });

  it("accepts supported image types and rejects unsupported or oversized files", () => {
    expect(() =>
      validateVisionImage("problem.webp", "image/webp", 100),
    ).not.toThrow();
    expect(() =>
      validateVisionImage("notes.pdf", "application/pdf", 100),
    ).toThrow("PNG, JPG, JPEG, or WEBP");
    expect(() =>
      validateVisionImage("large.png", "image/png", 4 * 1024 * 1024 + 1),
    ).toThrow("4 MB or smaller");
  });

  it("detects vision support from OpenRouter model metadata", () => {
    expect(
      isVisionModel({
        id: "example/vision",
        architecture: { input_modalities: ["text", "image"] },
      }),
    ).toBe(true);
    expect(
      isVisionModel({
        id: "example/text",
        architecture: { input_modalities: ["text"], modality: "text->text" },
      }),
    ).toBe(false);
  });
});
