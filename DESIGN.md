# UniCommu design

Mobile community board in Operate mode. User-approved purple, white and gray, inspired by the supplied university portal. Build component structure directly; no generated imagery is needed.

## Tokens
- Primary: #63349A; on-primary: #FFFFFF
- Background: #F6F5F8; surface: #FFFFFF
- Text: #28232F; secondary: #68616F
- Border: #E5E1E9; selected: #EFE7F7
- Urgent: #8A3C10 on #FFF8F2
- Spacing: 4 / 6 / 10 / 12 / 16 / 18 / 20 / 24
- Reading width: maximum 680 logical pixels, full available width on phones
- Text: native system font with Thai fallback; body 16 with line height 26; heading 28
- Controls: minimum height 48; wrap action rows for small screens and larger font sizes

## Components and states
Top-level Expo Router bottom tabs; safe-area content. FlatList for feeds. Separate content cards for community and announcements using one typed component. No decorative motion. Native scalable text. Empty lists explain recovery. Selected/disabled actions expose accessibility state. Mock provenance remains visible in the header. Prototype uses a fixed light palette; dark theme and device-level visual validation remain future work.

## Central token source
`src/constants/design-tokens.json` is authoritative. React Native imports its typed exports from `design-tokens.ts`. Run `npm run theme:generate` after editing; `src/design-tokens.css` is generated and imported by global.css. Run `npm run theme:check` to detect drift.

Current spacing scale: 4 / 8 / 12 / 16 / 20 / 24 / 32. Control radius 12; card radius 16. Body 16/26; labels 14/22; captions 12/20. These centralized tokens supersede the initial prototype dimensions above. All active prototype screens and their tab bar consume shared tokens.

## User-supplied Stitch reference (2026-10-23)
The user requested adapting all five prototype screens to their supplied Stitch screenshots. Tokens now use #FCF7FF for the main canvas, #F0E7F7 for selected surfaces, and #FFF0EF for urgent announcements. White content cards, compact purple brand header, inline create-post row, tag chips, and bottom PNG navigation icons follow the reference while keeping scalable text and 48-point controls. Feed width maximum is 560 logical pixels.

All community icons are local downloaded PNGs from Icons8; provenance and attribution are in assets/icons/community/CREDITS.md and the profile screen. No custom SVG or vector icon font. Profile avatar remains a generic downloaded icon, not a real person's photo. Mock saves and follows are seeded to make the corresponding screens reviewable.

## 3D visual direction and mock sign-in (2026-10-23)
New user references request a more expressive editorial mobile interface. Retain purple identity, adopt warm ivory 3D artwork, aubergine ink, larger headlines and 28-point hero/form surfaces. The generated campus artwork is a local PNG reused in sign-in and community hero; exact prompt and generation method are recorded in assets/images/unicommu/PROVENANCE.md. Existing downloaded PNG icons remain unchanged.

Sign-in appears before content tabs. Login/register/verification/profile setup/recovery request are client-only demo flows. No authentication service, account creation, email sending or persistence is implemented. Domain allowlist remains undecided. Recovery only displays a confirmation; password-reset links are not implemented. Do not represent this prototype as production authentication.

## Updated direction: user discarded the 3D concept
Generated 3D art removed at explicit user request. Current direction follows supplied references with a near-black canvas, white typography for headers, capsule dark auth inputs, violet accent, and large off-white cards. Login is now typography-led with no hero image. Feed uses a downloaded team photograph. Source recorded in assets/images/unicommu/PROVENANCE.md. Earlier 3D design notes are superseded.

## Mobile scroll/layout correction
All content headers (brand, title, subtitle) are inside each screen's single scrolling list/ScrollView. No stickyHeaderIndices or CSS sticky header. Only Expo Router bottom tab navigation remains anchored. Explicit flex/minHeight on screen viewports and flexShrink:0 on profile sections prevent identity content from compressing or clipping. Bottom tab height includes safe-area inset and reserves space for icon plus Thai label. Profile uses one grouped following list with compact actions, a complete identity panel and a consistent 16px page inset / 24px section gap.

## Community photo posts
Photo posts use a large rounded image cover with a readable dark title panel, author identity above and like/comment/save below. Text-only posts and official announcements retain their existing structure. Shared PostPhotoCover component supports image-load failure and long titles without fixed caption height. The composer can attach a bundled sample photo only; no device media permission or real upload is implemented. Static hero removed from feed to prioritize users' posts. No star ratings, travel labels or TikTok overlays copied from the reference.

## Announcement filter overlay
Faculty, category and date selectors are grouped in one dismissible overlay. Choices wrap instead of scrolling horizontally. Draft changes only affect the feed after Apply; Close, backdrop tap and Android Back discard draft changes. Clear selections resets the draft; the existing page-level clear action resets the applied filters and search. The sheet body scrolls independently on short screens and respects safe areas. Implementation: src/components/community/filter-overlay.tsx.

## Horizontal filter rows (user clarification)
All selector rows use the shared Chips component with horizontal ScrollView, nowrap and non-shrinking options: faculty/category/date in the announcement overlay, community categories, saved filters, notification filters. Earlier wrapped overlay choices are superseded. The overlay container remains; its option rows scroll sideways independently of the vertical sheet body. Long option lists do not expand the page width.

## Approved light direction
User approved the supplied light gray-green mobile reference. Main canvas is now #E9EEEB with white content surfaces and dark readable headings/body copy. Authentication, tab bar, global header, profile and other screen canvases all consume light semantic colors. Purple stays the interactive accent. White text is retained only on dark photo-caption panels and primary buttons; legacy night tokens do not drive screen backgrounds. No chat functionality is added from the reference.

## Purple-to-gray gradient direction
User replaced the gray-green reference palette with a muted purple-to-gray treatment. Background #EEEFF1; canvas gradient #ECE8F1 → #F1F2F3; post/profile gradient #DAD1E6 → #EEEFF1. Central color tokens remain authoritative. GradientSurface and CanvasGradient use Expo LinearGradient (~57.0.2, compatible with SDK57); no CSS-only native workaround. Announcements retain plain white/urgent surfaces. Main text stays dark for contrast, purple stays the action color.

## Dark gradient inside frames (latest user instruction)
Canvas stays light gray. Post cards and profile identity panel now transition #563573 → #19161F. Text and unselected action icons on those panels use white; selected chips keep their light purple background with dark purple text. Official announcements stay on light surfaces for reading. Supersedes the earlier pale card-gradient endpoints.

## Reusing the approved accent
The purple-to-black gradient now also appears on authentication welcome panels, primary action buttons, urgent announcements and compact saved/notification summaries. AccentBanner centralizes summary layout; GradientSurface remains the shared panel implementation; Action owns primary-button gradients. Dark panels use white text and icons. Regular announcements, inputs and filter controls retain light surfaces. No functionality, navigation or data persistence added by this visual extension.
