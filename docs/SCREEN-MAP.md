# Client screen map

Source: inspected Figma page `0:1` in file `hPdZDJS7QGA1YLHABcd72L` on 18 October 2026. There are 18 client screens plus Foundations `1:55`. The user-linked body `5:266` is inside Notifications `5:261`.

All implementation status is NOT YET ATTEMPTED. Browser route names below are proposals for review, not confirmed external API endpoints. Every screen requires English, dark/light, desktop/tablet/mobile, authorized real data and appropriate loading/error/empty states.

| No | Screen | Figma frame | Proposed browser route | Required behavior |
| --- | --- | --- | --- | --- |
| 01 | Login | 1:96 | /sign-in | Clerk sign-in, validation, remember-session behavior supported by Clerk, pending/blocked account routing. |
| 02 | Sign Up | 1:125 | /sign-up | Verified signup creates a pending Client; verified invitations activate only assigned access. |
| 03 | Forgot Password | 1:159 | /forgot-password | Supported Clerk recovery flow with safe confirmation and resend/error states. |
| 04 | Reset Password | 1:182 | /reset-password | Supported Clerk reset state, invalid/expired link handling and return to sign-in. |
| 05 | Verify Email | 1:208 | /verify-email | Verification/resend/change-email behavior and correct invitation/activation transition. |
| 06 | Onboarding | 4:2 | /onboarding | All six steps show true completion; no password collection; kickoff rule reviewed. |
| 07 | Dashboard Overview | 4:92 | /overview | Authorized projects, websites, review needs and activity from real data; no cross-client counts. |
| 08 | Projects and Websites | 4:209 | /projects | Scoped websites, active/completed projects, Drive links and real navigation. |
| 09 | Project Workspace | 4:304 | /projects/:projectId | Authorized overview, milestones, materials, Drive document links and activity. |
| 10 | Files and Feedback | 4:407 | /files | Scoped filters/uploads, immutable versions, feedback, approver actions and lifecycle states. |
| 11 | Invoices | 4:508 | /invoices | Only designated billing contacts; real generated invoices/PDFs; selected collection behavior. |
| 12 | Onboarding Questionnaire | 5:2 | /onboarding/questionnaire | Validated fields, draft autosave, explicit save, failure/retry and reload persistence. |
| 13 | Messages and Support | 5:92 | /messages | Authorized persistent conversations, attachments and selected membership/history rules. |
| 14 | Meetings and Calendar | 5:180 | /meetings | Cal.com booking/reschedule/cancel and scoped project calendar, synchronized from trusted events. |
| 15 | Notifications | 5:261 | /notifications | Persistent per-user read/unread history and reviewed browser-push subscription/event behavior. |
| 16 | Profile and Security | 5:356 | /settings | Profile, Clerk security/MFA/session flows, theme and reviewed notification/billing preferences. |
| 17 | Help Center and Ticket | 5:452 | /support | Published help and own ticket creation/history; Owner responses and reviewed status rules. |
| 18 | No Active Project | 5:530 | /overview (empty state) | No unrelated project data; start-project request and support action lead to real reviewed flows. |

## Owner interface

No Owner reference screens were supplied. Propose the minimum matching Owner interface to operate Client approval/invitations, project/website assignment, milestones/onboarding, Drive links, file versions/review/lifecycle, invoices, messages/groups, meetings, push configuration and support/help content. Do not fabricate Figma node IDs for these views. Show the layout proposal before implementation under its approved task plan.

## Required states beyond static frames

Include pending activation, forbidden access, empty lists, expired sessions/reset links, declined push permission, failed uploads/saves, unavailable provider surfaces and slow/loading requests. Match the screen's visible purpose without inventing automatic business transitions.

## Completion record

During implementation, add the plan/source evidence, tests and dated screenshots for every row. A route with fixtures or inactive actions is not complete. Keep the dashboard selection, current menu item and current user role accurate rather than copying the same reference state everywhere.

