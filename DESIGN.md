# UniCommu design

## Tablet adaptation (2026-10-24)
Available window width controls layout, including rotation and split-screen. Below 768 logical pixels, preserve the existing 560 maximum reading width. At 768 and above, all five content screens share a centered 720 maximum width. Authentication and filter forms retain a 560 maximum width. Tablet filters open in the center; phone filters remain bottom sheets. Bottom navigation destinations stay grouped within 720 logical pixels. Portrait and landscape are enabled, with iPad support and multitasking enabled in Expo config. Native iPad validation is still required on hardware or a simulator; browser checks only verify web layout.

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

## Authentication layout refinement
Authentication scroll content grows to fill the available viewport. Tablet layouts center the complete authentication shell vertically when it fits; longer forms remain scrollable. Landscape windows at least 768 logical pixels wide use a centered two-pane shell up to 1040 wide with a 24-point gutter. Welcome content sits on the left and the form on the right. Narrow windows and large font scale use the single-column layout. Keyboard avoidance remains active on iOS; native keyboard and iPad validation still require a device.

## Welcome image
Authentication welcome panels use the local AI-generated campus-welcome-v1.png with a purple overlay from centralized authPhotoShade/authPhotoTint tokens. WelcomeHero keeps text native and falls back to the original gradient if the image fails. The image is illustrative, not an actual campus photograph; prompt and provenance are saved beside the asset.

## Logo and launch preview (2026-11-12)

The user selected the generated purple UniCommu mark in assets/images/branding/unicommu-logo-v1.png for a trial. BrandLogo shares the PNG between authentication and community headers. Expo icon, favicon and native splash configuration reference the same asset. These native launcher/splash changes require a new app build to validate.

Startup begins with a round purple circle moving from above the viewport to the center with a 650 ms accelerating descent, then expanding to fill the screen, followed by three steps: a centered logo on solid purple, a full purple welcome screen with the brand above Thai copy and campus artwork below, then the existing login screen after pressing เริ่มต้นใช้งาน. LaunchOverlay reveals the centered logo, holds for 400 ms, then moves it to the welcome header over 600 ms while reducing its size from 104 to 80 points. The overlay then fades over 350 ms to reveal the welcome content; the destination respects safe-area insets; reduced motion skips the overlay. The welcome screen remains until the user presses the button. It uses the existing in-memory authentication flow and does not add account persistence. Native device validation is still required.

## Welcome campus video (2026-11-12)
WelcomeScreen replaces its still artwork with the official RMUTP introduction video (YouTube ID ww4JeFSn2Ew). CampusVideo provides a web iframe and native WebView, loaded after LaunchOverlay completes. The player keeps YouTube controls and has a visible source link. It requests muted inline autoplay and looping; playback depends on device policy and network. No YouTube media is downloaded or rehosted. The native WebView still needs device verification. The AI campus photo remains available for the existing authentication hero.

## Welcome illustration and orbit (2026-11-12)
Replaces the YouTube trial above: no video player or WebView dependency remains. WelcomeArtwork displays the local Storyset Group discussion PNG with source attribution, without a card frame, and pans up/left 56/24 points while settling from scale 1.08 to 1 over 850 ms after launch completes. Reduced motion shows the still image. LaunchOrbit uses six locally bundled Microsoft Fluent Emoji 3D PNGs to orbit the centered logo through 120 degrees over 1800 ms, counter-rotating each image to keep it upright. The orbit fades before the existing logo-to-header transition. Source and license files live beside the assets.

## Launch scatter refinement (2026-11-12)
Supersedes the orbit above. Five bundled photographic PNG objects spread out from behind the centered logo over 650 ms, then each turns once over 1400 ms in alternating directions. The group stays in place rather than orbiting. Objects fade over 200 ms before the existing logo-to-header transition. Reduced motion still skips the intro. Asset sources live in assets/images/launch/photos/CREDITS.md. Native-device motion validation remains required.

### Orbit clarification
After the 650 ms scatter completes, the entire object layer rotates 160 degrees around the stationary centered logo. Each photo counter-rotates to preserve its tilt. The bounded circular reach prevents portrait-screen clipping; the existing fade and logo-to-header transition follow.

### Layered slow orbit
Objects now travel on independent elliptical arcs of 29–46 degrees over 3200 ms after scattering. Different sizes, alpha and depth-scale changes replace the rigid rotating group; photos retain a gentle tilt. A short Thai explanation appears near the bottom on viewports at least 600 points tall and fades with the objects, before the logo rises. No continuous animation loop is added.

### Cohesive generated launch objects
LaunchOrbit now consumes five generated 3D product PNG cutouts in generated-v1: a lavender backpack, laptop, basketball, camera and takeaway coffee. All share lavender/ivory materials and studio lighting. Files are optimized to 320px with transparent alpha preserved, and full generation prompts are recorded beside the assets. The approved slow, layered motion is unchanged.

## Photographic login backdrop (2026-11-12)
Login now uses a single centered mobile-first surface: the existing illustrative campus photo sits behind the header and welcoming text, fading vertically into the white form. LoginHero and LoginBackdrop are separate components outside routes. AuthPhotoFade is a centralized color token with generated CSS. Only login uses this layout; registration, verification and recovery retain their existing responsive layouts and behavior. Existing mock-login notices remain visible. No social sign-in or backend behavior was added.

### Registration shares the photo treatment
Registration now shares AuthPhotoBackdrop and AuthPhotoHero with login. Its existing heading, all fields, consent, validation, request state and verification flow remain intact. The full form scrolls in one column on phones and tablets. Recovery and verification retain the previous layout.

## Post action row (2026-11-19)
The user supplied Instagram as the reference for post interactions. Like and comment actions now show an icon and compact count on the left, with an icon-only save action aligned right. These controls have transparent backgrounds and no selected capsules; filled heart/bookmark PNGs communicate liked/saved states. Dark cards retain light icons; light surfaces use purple for selected actions. Touch targets remain at least 48 points, with explicit screen-reader labels and expanded comment state. On web, pointer focus outlines are suppressed only for these actions; keyboard focus remains visible through scoped `:focus-visible` styles. Comment composition and shared buttons elsewhere retain their existing behavior. Native device and live-browser interaction validation remain required.

## Comments sheet (2026-11-19)
The user supplied Instagram's comments panel as the reference. Tapping the comment icon now opens a dark aubergine bottom sheet over a dimmed feed, replacing the inline textarea and full-width submit button. The sheet includes a drag handle, centered title/count, explicit close action, a virtualized thread list, initial-based avatars with display names and timestamps, comment likes, collapsible replies, quick emoji insertion, and a compact composer anchored above the safe area/keyboard. Draft text and reply target survive closing and reopening the same post. Backdrop tap, close button, Escape/Android Back and a downward header drag dismiss the panel; reduced motion skips the entrance/exit. Tablets constrain its width; short windows shrink the list while retaining the composer. The browser visual viewport is observed for mobile Safari keyboard overlap. Pointer modality explicitly suppresses post-action outlines even when a browser retains `:focus-visible`; keyboard focus remains available. Comments and their likes/replies still use the existing in-memory community store; this UI change does not add server persistence or attachment uploads.

## Sliding navigation capsule (2026-11-19)
The user's video references Instagram's floating bottom bar and the capsule that moves between selected tabs. The existing five Expo Router destinations now share a dark aubergine capsule bar with an animated translucent selection pill. A bounded spring translates the pill with a small temporary stretch; rapid changes interrupt the previous animation, resizing snaps to the correct geometry, and reduced motion updates immediately. Existing Thai labels and unread counts remain. Web renders a backdrop blur and respects reduced transparency; compatible iOS 26 builds use the already-installed Expo GlassEffect after both availability checks, with an ordinary tinted surface elsewhere. Safe-area padding, 48-point controls, keyboard arrow navigation and visible keyboard focus are retained. Real iOS glass rendering still needs device validation.

### Verification
Expo lint, TypeScript, theme consistency and the web export pass. An isolated Chrome preview with synthetic login data verified comment submission, emoji insertion, likes, threaded replies, draft retention, dismissal by Escape and downward touch drag, and a simulated mobile Safari visual-viewport keyboard resize. Captures cover a 320-point phone, 390-point phone, phone landscape and tablet. The navigation pill was sampled across animation frames, including rapid tab changes, keyboard arrows, route URLs and resized touch targets; no page errors were observed. Browser screenshots do not validate native keyboard behavior or the iOS glass effect.

## Instagram-inspired community feed without stories (2026-11-19)
The user requested Instagram's home-feed arrangement and explicitly excluded stories. Home now begins with one compact toolbar: create on the left, UniCommu/category selector in the center and search on the right. Search and category choices expand on demand. The large heading, inline composer, rules banner and result count no longer precede the first post. Community posts follow author → full-width photo → like/comment/save → caption, hashtags and comment entry, retaining the approved purple-to-dark palette. Feed images preserve their bundled aspect ratios within Instagram-style portrait/landscape bounds instead of forcing landscape photographs into a portrait crop. Media no longer nests inside rounded cards or repeats the title over the photo. Text-only posts retain a readable text-first layout. The column caps at 560 points on tablets; other screens retain their existing card layout and reading widths. Post creation opens a separate modal and preserves its draft when dismissed; community rules remain in that composer. Posting, image selection from bundled illustrations and all data persistence retain their existing local behavior. The floating tabs and comments sheet remain in use.

## Continuous dark canvas, discovery and profile library (2026-11-19)
The user replaced the light social canvas with continuous black-purple. Authenticated frames, feed posts, feed toolbar, composer and navigation surround now share #19161F; the feed has no separator strips. Authentication retains its established treatment. General screen headings and empty states use light text; official announcement and notification content cards retain readable existing surfaces.

The third main destination is now Search (`/explore`), replacing Saved. It offers an Instagram-inspired three-column image grid and search across existing post titles, bodies, tags, author names and faculties. Grid tiles use available post data only, with text fallbacks for items without photos. Photo backgrounds and thumbnails explicitly fill their containers so intrinsic asset dimensions do not leave cropped, unscaled image fragments on web.

Profile has compact identity/stats, local name editing, and tabs for own posts, private saved items and followed university pages. Saved items retain community/announcement filters; `/saved` redirects to `/profile?tab=saved`. Post bookmarks still toggle the same store. Grid entries navigate through Expo Router to `/post/[id]`; the bar highlights Search or Profile according to origin, and history-based Back restores the originating view and search/filter state. No repost broadcasting, followers, chat, video uploads or new persistence service is introduced.

Verification covers the dark feed's contiguous post bounds, grid search and empty recovery, detail routes and Back restoring the query, likes/comments from discovery, profile saved filters and unsave synchronization, own text-post publication, profile editing, phone/landscape/tablet layouts and the legacy saved redirect. The isolated browser run reports no page errors. Render's static-site blueprint includes a `/post/*` rewrite to the app entry for direct post URLs; no deployment was performed.

## Community persistence (2026-11-21)
The social layouts above now consume the authenticated community API for posts, uploaded photos, likes, comments/replies, saved posts and reports. Feed categories and discovery queries run on the server; cursor pagination preserves the feed order. The composer selects an actual device photo, retains its draft on failure and retries creation with the same request ID. Images live in private Supabase Storage with temporary signed links; image metadata is stripped during server processing. Profile libraries load all pages when opened, and own posts use the session user ID. Display-name editing, announcements and followed organizations retain their previous local behavior.

Faculty/program labels belong to a post and can contain multiple selections. Only approved organization members within their faculty scope, the student council or administrators can assign them through the API. The organization-management and classification screens are not part of this change, and real catalog/membership data must be provisioned before using those endpoints.

Verification includes lint, TypeScript, theme consistency, web/native iOS bundles, isolated PostgreSQL/UI tests, rolled-back PostgreSQL integration and a real private-Storage upload/download with test-file cleanup. Native device keyboard and glass rendering still require device validation.
