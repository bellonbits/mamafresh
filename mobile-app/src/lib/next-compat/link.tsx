// Drop-in replacement for next/link's default export, backed by react-router-dom.
// Ported pages import this as `Link` in place of `next/link` — same `href` API.
import { forwardRef } from "react";
import type { AnchorHTMLAttributes } from "react";
import { Link as RouterLink } from "react-router-dom";

interface NextLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
}

const Link = forwardRef<HTMLAnchorElement, NextLinkProps>(function Link(
  { href, prefetch: _prefetch, scroll: _scroll, replace, ...rest },
  ref
) {
  // External / absolute / protocol / anchor links: use a plain <a>, react-router only handles in-app routes.
  if (/^([a-z][a-z0-9+.-]*:)|^#/i.test(href)) {
    return <a ref={ref} href={href} {...rest} />;
  }
  return <RouterLink ref={ref} to={href} replace={replace} {...rest} />;
});

export default Link;
