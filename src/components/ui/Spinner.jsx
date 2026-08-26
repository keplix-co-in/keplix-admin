/**
 * Spinner — the app's single loading indicator.
 *
 * Sizes are the two the dashboard actually needs: `sm` sits inside a button
 * label, `md` stands alone in a table body.
 */
export default function Spinner({ size = 'md', className = '' }) {
  const px = size === 'sm' ? 14 : size === 'lg' ? 28 : 20;
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block align-[-2px] animate-spin rounded-full border-2 border-white/20 border-t-white ${className}`}
      style={{ width: px, height: px }}
    />
  );
}
