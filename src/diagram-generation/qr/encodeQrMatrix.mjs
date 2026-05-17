/**
 * encodeQrMatrix.mjs — QR module grid for diagram BrandQR (payload → dark cells).
 * Kind: Pure logic. Uses qrcode-generator; does not render SVG.
 */

import qrcodeFactory from "qrcode-generator";

/**
 * @typedef {{
 *   moduleCount: number,
 *   cells: boolean[],
 * }} QrMatrix
 */

/**
 * @param {string} payload
 * @returns {QrMatrix} row-major **cells**; index **row * moduleCount + col**; row **0** is the top row of the symbol.
 */
export function encodeQrMatrix(payload) {
  if (typeof payload !== "string" || payload.length === 0) {
    throw new Error("encodeQrMatrix: payload must be a non-empty string");
  }
  const qr = qrcodeFactory(0, "M");
  qr.addData(payload);
  qr.make();
  const moduleCount = qr.getModuleCount();
  /** @type {boolean[]} */
  const cells = [];
  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      cells.push(qr.isDark(row, col));
    }
  }
  return { moduleCount, cells };
}
