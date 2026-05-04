import type { Landmark } from '../types/inference';

export const landmarkUtils = {
  /**
   * Validates that landmarks array has exactly 21 items with valid x, y, z values
   */
  isValidLandmarks: (landmarks: unknown): landmarks is Landmark[] => {
    console.log('[landmarkUtils.isValidLandmarks] Called with:', landmarks);

    if (!Array.isArray(landmarks)) {
      console.warn('[landmarkUtils.isValidLandmarks] ❌ FAIL — not an array. Got:', typeof landmarks);
      return false;
    }

    if (landmarks.length !== 21) {
      console.warn(
        `[landmarkUtils.isValidLandmarks] ❌ FAIL — expected 21 landmarks, got ${landmarks.length}`
      );
      return false;
    }

    console.log('[landmarkUtils.isValidLandmarks] ✅ Array length is 21, checking individual points...');

    const result = landmarks.every((lm, i) => {
      if (typeof lm !== 'object' || lm === null) {
        console.warn(`[landmarkUtils.isValidLandmarks] ❌ Landmark[${i}] is not an object:`, lm);
        return false;
      }

      const landmark = lm as Record<string, unknown>;

      const xOk = typeof landmark.x === 'number' && landmark.x >= 0 && landmark.x <= 1;
      const yOk = typeof landmark.y === 'number' && landmark.y >= 0 && landmark.y <= 1;

      // ⚠️  KNOWN ISSUE: MediaPipe z is depth-relative and CAN be negative.
      // This check will reject valid landmarks where z < 0.
      // TODO: change to just `typeof landmark.z === 'number'` once confirmed.
      const zOk = typeof landmark.z === 'number';

      if (!xOk || !yOk || !zOk) {
        console.warn(
          `[landmarkUtils.isValidLandmarks] ❌ Landmark[${i}] failed validation:`,
          {
            raw: lm,
            x: { value: landmark.x, ok: xOk },
            y: { value: landmark.y, ok: yOk },
            z: { value: landmark.z, ok: zOk },
          }
        );
        return false;
      }

      return true;
    });

    if (result) {
      console.log('[landmarkUtils.isValidLandmarks] ✅ All 21 landmarks passed validation');
    } else {
      console.warn('[landmarkUtils.isValidLandmarks] ❌ Validation failed — see individual landmark errors above');
    }

    return result;
  },

  /**
   * Convert MediaPipe landmarks to array format for API
   */
  landmarksToArray: (
    landmarks: Landmark[]
  ): [number, number, number][] => {
    console.log('[landmarkUtils.landmarksToArray] Converting', landmarks.length, 'landmarks to array');

    const result = landmarks.map((lm) => [lm.x, lm.y, lm.z] as [number, number, number]);

    console.log('[landmarkUtils.landmarksToArray] Output length:', result.length, '(expected 21)');
    console.log('[landmarkUtils.landmarksToArray] Sample [0]:', result[0]);
    console.log('[landmarkUtils.landmarksToArray] Sample [10]:', result[10]);
    console.log(
      '[landmarkUtils.landmarksToArray] Z range:',
      Math.min(...result.map((p) => p[2])).toFixed(4),
      '→',
      Math.max(...result.map((p) => p[2])).toFixed(4)
    );
    console.log(
      '[landmarkUtils.landmarksToArray] Any NaN?',
      result.flat().some((v) => isNaN(v))
    );

    return result;
  },

  /**
   * Denormalize landmarks from [0, 1] to pixel coordinates
   */
  denormalizeLandmarks: (
    landmarks: Landmark[],
    width: number,
    height: number
  ): Array<{ x: number; y: number; z: number }> => {
    console.log(
      `[landmarkUtils.denormalizeLandmarks] Denormalizing ${landmarks.length} landmarks to ${width}x${height}`
    );

    const result = landmarks.map((lm) => ({
      x: lm.x * width,
      y: lm.y * height,
      z: lm.z,
    }));

    console.log('[landmarkUtils.denormalizeLandmarks] Sample [0]:', result[0]);

    return result;
  },
};