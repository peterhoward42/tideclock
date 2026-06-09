/**
 * urlLocationErrorCopy.ts — User-facing copy when a share-link place could not be resolved.
 */

import type { UrlLocationErrorReason } from './routes/home/routeProps';

export const urlLocationErrorHeadline =
  'This link did not match a place in The Tide Dial';

export const urlLocationErrorBodyLead =
  'Share links need both a place and a county in the address, for example ';

export const urlLocationErrorBodyExample = '?place=Looe&county=Cornwall';

export const urlLocationErrorBodyTail =
  '. Check the spelling, or open Location in the menu to pick your place.';

export function urlLocationErrorReceivedLine(
  place: string | null,
  county: string | null,
): string | null {
  if (place === null && county === null) {
    return null;
  }
  const parts: string[] = [];
  if (place !== null) {
    parts.push(`place=${place}`);
  }
  if (county !== null) {
    parts.push(`county=${county}`);
  }
  return `Received: ${parts.join(', ')}`;
}

export function urlLocationErrorDetailForReason(
  reason: UrlLocationErrorReason,
): string | null {
  switch (reason) {
    case 'missing_param':
      return 'Both place and county are required in the link.';
    case 'ambiguous':
      return 'That place and county matched more than one entry in our list.';
    case 'unknown':
      return 'We could not find that place and county combination.';
    default:
      return null;
  }
}
