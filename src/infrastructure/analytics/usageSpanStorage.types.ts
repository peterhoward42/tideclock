/** Read-side persistence seam for usage-span anchors. */
export interface UsageSpanLoader {
  getItem(key: string): string | null;
}

/** Write-side persistence seam for usage-span anchors. */
export interface UsageSpanStorer {
  setItem(key: string, value: string): void;
}
