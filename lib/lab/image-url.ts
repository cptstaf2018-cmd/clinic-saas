export function testImageUrl(id: string, imagePath: string | null, updatedAt: Date): string | null {
  return imagePath ? `/api/lab/tests/${id}/image?v=${updatedAt.getTime()}` : null;
}
