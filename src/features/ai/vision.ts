import type { OpenRouterModel } from "./types";

export const VISION_IMAGE_TYPES = ["png", "jpg", "jpeg", "webp"] as const;
export const MAX_VISION_IMAGE_BYTES = 4 * 1024 * 1024;

export type VisionImage = {
  name: string;
  mimeType: `image/${string}`;
  dataUrl: string;
  size: number;
};

export function isVisionModel(model?: OpenRouterModel) {
  if (!model) return false;
  const modalities = model.architecture?.input_modalities ?? [];
  const declaredInput = modalities.some(
    (modality) => modality.toLowerCase() === "image",
  );
  const modalityDescription = model.architecture?.modality?.toLowerCase() ?? "";
  return declaredInput || modalityDescription.includes("image");
}

export function getVisionModelHint(model?: OpenRouterModel) {
  return isVisionModel(model) ? "Vision" : "Text only";
}

export function extensionForMimeType(mimeType: string) {
  return mimeType.split("/")[1]?.toLowerCase() ?? "";
}

export function validateVisionImage(
  name: string,
  mimeType: string,
  size: number,
) {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  const validType =
    mimeType.startsWith("image/") &&
    VISION_IMAGE_TYPES.includes(
      extension as (typeof VISION_IMAGE_TYPES)[number],
    );
  if (!validType) {
    throw new Error("Choose a PNG, JPG, JPEG, or WEBP image.");
  }
  if (size > MAX_VISION_IMAGE_BYTES) {
    throw new Error("Images must be 4 MB or smaller.");
  }
}

export function bytesToDataUrl(bytes: Uint8Array, mimeType: string) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

export function getMessageText(
  content: string | Array<{ type: "text" | "image_url"; text?: string }>,
) {
  return typeof content === "string"
    ? content
    : (content.find((part) => part.type === "text")?.text ?? "");
}
