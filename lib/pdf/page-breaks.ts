export interface BreakBlock {
    top: number;
    bottom: number;
  }
  
  /** Measures every `.break-inside-avoid` element in canvas pixels. */
  export function collectBlocks(node: HTMLElement, ratio: number): BreakBlock[] {
    const origin = node.getBoundingClientRect().top;
  
    return Array.from(
      node.querySelectorAll<HTMLElement>(".break-inside-avoid"),
    ).map((element) => {
      const rect = element.getBoundingClientRect();
  
      return {
        top: (rect.top - origin) * ratio,
        bottom: (rect.bottom - origin) * ratio,
      };
    });
  }
  
  /** Ends the PDF page before a block that would otherwise be cut in half. */
  export function findSliceEnd(
    offset: number,
    maxEnd: number,
    blocks: BreakBlock[],
    pageHeightPx: number,
  ): number {
    const straddling = blocks.filter(
      (block) =>
        block.top > offset + 1 &&
        block.top < maxEnd &&
        block.bottom > maxEnd &&
        block.bottom - block.top <= pageHeightPx,
    );
  
    if (straddling.length === 0) return maxEnd;
  
    const end = Math.floor(Math.min(...straddling.map((block) => block.top)));
  
    return end - offset < pageHeightPx * 0.25 ? maxEnd : end;
  }