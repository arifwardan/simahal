export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(date);
}