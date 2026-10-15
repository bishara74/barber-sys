/**
 * Re-mounted on every dashboard navigation, so each page fades in.
 * Opacity only: a transform here would trap fixed-position elements inside pages.
 */
export default function PanelTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
