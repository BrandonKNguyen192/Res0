import '@/app/globals.css';

// A SECOND ROOT LAYOUT, deliberately.
//
// The guest menu is the only surface a diner sees, and they are not a member of the
// organisation — so the operator's chrome (nav, org chip, billing) has no business being
// there. Route groups let /m/[slug] escape the app shell entirely rather than hiding pieces
// of it with CSS, which is the difference between a public page and an app page wearing a
// disguise.
export const metadata = {
  title: 'Menu',
  description: 'Guest menu',
};

export default function PublicLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
