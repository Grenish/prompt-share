/**
 * Client-side authentication utilities for handling protected actions.
 * These helpers coordinate between server-side auth checks and client-side redirects.
 */

import { redirect } from 'next/navigation';

/**
 * Error code returned by server actions when user is not authenticated.
 * Components should check for this specific error to trigger login redirect.
 */
export const NOT_AUTHENTICATED_ERROR = 'NOT_AUTHENTICATED';

/**
 * Check if an action result indicates the user is not authenticated.
 * If true, the component should redirect to login or show a login prompt.
 */
export function isNotAuthenticatedError(error?: string | null): boolean {
  return error === NOT_AUTHENTICATED_ERROR;
}

/**
 * Redirect to login page from a client component.
 * Useful for handling auth errors in form actions or callbacks.
 * 
 * @param from Optional path to redirect back to after login
 */
export function redirectToLogin(from?: string) {
  const url = new URL('/login', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  
  if (from) {
    url.searchParams.set('from', from);
  } else if (typeof window !== 'undefined') {
    url.searchParams.set('from', window.location.pathname);
  }
  
  redirect(url.toString());
}

/**
 * Navigate to login page (for use in event handlers, not during render).
 * Useful for button clicks or form submissions.
 * 
 * @param from Optional path to redirect back to after login
 */
export function navigateToLogin(from?: string) {
  const url = new URL('/login', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  
  if (from) {
    url.searchParams.set('from', from);
  } else if (typeof window !== 'undefined') {
    url.searchParams.set('from', window.location.pathname);
  }
  
  if (typeof window !== 'undefined') {
    window.location.href = url.toString();
  }
}
