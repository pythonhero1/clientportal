# Sources

Research checked 18 October 2026. Official documentation can change; verify installed versions and provider capabilities during implementation. These links support technical choices and compatibility checks, not a claim that any service was configured or tested.

## Project sources

- Stephen's uploaded `agent-kit-v2(1).zip`: memory, task planning, adversarial review and handoff structure.
- Stephen's explicit current answers and earlier approved architecture decisions, with current Owner/Client scope taking precedence.
- Figma file `hPdZDJS7QGA1YLHABcd72L`, page `0:1`; 18 client screens plus Foundations. Linked body `5:266` belongs to Notifications screen `5:261`.
- Design reference: https://www.figma.com/design/hPdZDJS7QGA1YLHABcd72L/Oderinde-Stephen-Client-Portal-UI?node-id=5-266

## Official technical references

- Antigravity rules and frontmatter: https://antigravity.google/docs/rules
- Antigravity workflow migration and October 19 cutoff: https://antigravity.google/docs/migration/workflows-to-skills
- Antigravity legacy workflow notice: https://antigravity.google/docs/ide/workflows
- Node.js release support: https://nodejs.org/en/about/previous-releases
- Vite setup and React TypeScript template: https://vite.dev/guide/
- NestJS setup and runtime requirements: https://docs.nestjs.com/first-steps
- NestJS WebSocket gateways: https://docs.nestjs.com/websockets/gateways
- Prisma requirements: https://www.prisma.io/docs/orm/reference/system-requirements
- Tailwind Vite installation: https://tailwindcss.com/docs/installation/using-vite
- Clerk React quickstart and SDK generation: https://clerk.com/docs/react/getting-started/quickstart
- Cal.com embedding: https://cal.com/embed
- Cal.com documentation: https://cal.com/docs
- Bitwarden Send capabilities: https://bitwarden.com/help/about-send/
- Bitwarden Send expiration: https://bitwarden.com/help/send-lifespan/
- Browser Push API: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- Push permission/subscription behavior: https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe
- Service worker secure context: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- S3 object access and upload documentation: https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html

## Version policy

Node.js 24 was an LTS line at research time; use its current patched release and pin the exact tested version in the implementation. Resolve compatible stable application dependencies once, commit their lockfile and use `npm ci` afterwards. Do not reuse an old Clerk package name, Prisma initialization pattern or Nest CLI flag without checking the installed major's official guidance.
