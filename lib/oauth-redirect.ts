import { NextResponse } from "next/server";
import { getOAuthAppOrigin } from "@/lib/google-oauth";

/** OAuth callback / алдааны redirect — production дээр зөв домэйн */
export function oauthRedirectUrl(req: Request, pathname: string, searchParams?: URLSearchParams): URL {
  const url = new URL(pathname, getOAuthAppOrigin(req));
  if (searchParams) {
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }
  return url;
}

export function oauthRedirect(
  req: Request,
  pathname: string,
  searchParams?: URLSearchParams,
  status = 303,
): NextResponse {
  return NextResponse.redirect(oauthRedirectUrl(req, pathname, searchParams), status);
}
