/**
 * Button — the one button primitive for the admin dashboard.
 *
 * Codifies the newer of the two visual dialects that existed in the views
 * (rounded-xl, brand-red solid primary, white/10 secondary) so that a button
 * looks the same wherever it appears.
 *
 * `loading` renders a spinner AND disables the button, which is what stops a
 * double-click from firing a payout or a refund twice.
 */
const VARIANTS = {
  primary: 'bg-brand-red text-white hover:bg-[#ff5252]',
  secondary: 'bg-white/10 text-white hover:bg-white/20',
  ghost: 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white',
  danger: 'bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/20',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  title,
  className = '',
  onClick,
  children,
  ...rest
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors disabled:opacity-45 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/60 ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="inline-block animate-spin rounded-full border-2 border-current/30 border-t-current"
          style={{ width: size === 'sm' ? 11 : 13, height: size === 'sm' ? 11 : 13 }}
        />
      )}
      {children}
    </button>
  );
}
