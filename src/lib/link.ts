// Personal links look like /c/<token>/... The token stays in the address so a home-screen
// icon added from any page keeps the person signed in.
const m = window.location.pathname.match(/^\/c\/([A-Za-z0-9_-]{20,})/)
export const linkToken: string | null = m ? m[1] : null
export const basename = m ? `/c/${m[1]}` : ''
/** Current path inside the app, without the personal link prefix. */
export const appPath = () => window.location.pathname.slice(basename.length) || '/'

export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true } catch { return false }
}
