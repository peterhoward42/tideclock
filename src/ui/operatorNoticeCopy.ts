/**
 * Copy for the build-time operator notice (maintenance / emergency / contingency).
 */

export const operatorNoticeHeadline = "The Tide Dial is temporarily unavailable";

/** Main paragraphs shown when {@link OPERATOR_NOTICE_ACTIVE} is on (or dev preview). */
export const operatorNoticeBodyParagraphs = [
  "Something needs attention before the dial can run reliably again.",
  "Please check back soon.",
] as const;
