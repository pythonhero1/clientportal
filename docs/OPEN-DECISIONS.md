# Open decisions

Updated 18 October 2026. This list preserves uncertainty instead of guessing what a yes meant. Resolve affected items before their implementation or production activation; keep independent approved work moving.

## Essential clarification batch

1. Hosting: What is the provider and exact plan, and does `7Gb` refer to RAM, disk, database storage, bandwidth or something else? A plan name or specification is enough. Confirm the service budget and required data region before selecting paid providers.
2. Billing: Which currency or currencies, which seller/business country, and which payment method should invoices offer: bank transfer, an online gateway, or both? Has a gateway account already been approved? Internally generated invoices are settled; the later yes did not select a payment method.
3. Messaging: Select the removal/rejoining policy. The proposed policy is immediate loss of portal conversation access on removal, visibility from the latest join on return, and no group that exposes unrelated Clients. Message editing, deletion, receipts and typing indicators remain off the implementation plan until selected. A yes to the earlier set of opposing options did not approve these behaviors.

These are the smallest blocking clarifications for hosting, billing and messaging. The proposals below can be reviewed together with their relevant plans rather than creating a long series of interviews.

## Decision status by area

| ID | Decision needed | Current status | Blocks |
| --- | --- | --- | --- |
| Q01 | Provider, plan and meaning of 7Gb | OPEN | Production topology and capacity claims |
| Q02 | Service budget and data region | OPEN | Paid account selection and residency commitments |
| Q03 | Initial users and binary storage capacity | OPEN | Quotas, costs and capacity acceptance |
| Q04 | Multiple user accounts within one client company | OPEN | Automatic company-wide membership and colleague invitation rules |
| Q05 | Invoice currencies, seller details, numbering, tax and payment method | OPEN | Issuing real invoices and payment launch |
| Q06 | Removal, rejoining and cross-client group privacy | OPEN; proposed policy available | Membership transitions and production group messaging |
| Q07 | Message edit/delete, read receipts and typing | OPEN | Those optional operations |
| Q08 | Notification event list, recipients beyond deletion events, timing and user preferences | PROPOSED; push channel approved | Automatic event delivery/reminder activation |
| Q09 | Ticket statuses, priorities, Owner assignment and help-article editing | PROPOSED; support screens in scope | Final support workflow |
| Q10 | Message/audit retention and backup/recovery targets | PROPOSED at Stephen's request | Production retention jobs and recovery commitment |
| Q11 | Onboarding approval effects, milestone transitions and revision limits | PROPOSED; six-step UI approved | Irreversible business transitions and automatic limits |
| Q12 | Client-company billing contacts and final approvers | Existing explicit per-project grants retained; company-wide defaults OPEN | Automatic access based on company membership |
| Q13 | Change from per-task approval to per-phase approval | NOT SELECTED; inherit supplied task gate | No independent work; only a requested gate change |
| Q14 | Cal.com account, event type, calendar connection and webhook capabilities | Provider selected; account configuration OPEN | Real booking synchronization |
| Q15 | Drive account/link permissions and document list | Links-only selected; actual links OPEN | Production document access |
| Q16 | Malware scanning provider/capacity for all approved formats and 500 MB files | PROPOSED ClamAV or reviewed managed alternative | Serving untrusted production uploads |

## What the agent may do now

Prepare the workspace plan, propose contracts, build approved independent foundation work, create reviewed fixture previews with clear labels, and establish the real Owner/Client authorization model. It may not choose a payment gateway, reinterpret 7Gb as a resource allocation, invent notification timing, or enable an unselected membership policy.

If an open answer becomes explicit, update this file, the register and the relevant memory decision together. Preserve the original requirement and date. Do not re-ask settled questions.
