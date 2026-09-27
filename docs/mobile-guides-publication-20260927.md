# Mobile learning guides publication — 27 September 2026

- GitHub main: `2748aabc4ae131f20dba60197ed4c83bd93d291c`.
- Release checkout: `release/mobile-guides-final-20260927`.
- Vercel production: `dpl_HighmgMyrT4MtpMYAQbjFjVY2McH`, Ready.
- Deployment: https://lecomax-b97mpvko9-lecomaxstore-4321s-projects.vercel.app
- Aliased to https://lecomax.com and https://www.lecomax.com.
- Published the one-lesson reader, all 15 beginner exercises and results, larger text, mobile layouts, saved progress, and the three guide cards above the site preview.
- Default production learning page now opens the site workshop, matching localhost. Existing production AI tutor and other features were preserved.
- Checks: production build, TypeScript, seven focused tests; headless production-browser checks at 320/390/768/1440px, three guides and French/English/Arabic. Screenshot: `release/mobile-guides-final-20260927/.source-library/backend-mobile.png`.
- Local browser validation used isolated test credentials. Live HTTP checks confirmed the storefront returns 200 and the private course page redirects to login without credentials. An authenticated live visual check was unavailable because no browser provider was connected.
- Unrelated work in the original working directory was not included in this release.

## Source explorer follow-up

- GitHub main: `c544240ea5801df0a9ad4e841f449f60603435b2`.
- Vercel: `dpl_BMSMo9u6z2HevDghtiiYMq1SmTfW`, Ready, confirmed serving `lecomax.com`.
- Default view now shows the site preview; the three guides have a separate mode.
- Clicking elements opens actual source, selected JSX properties, line explanations, and a Files & data view. Related files can be opened and revisited in the same reader.
- Static evidence covers imports, importing files, recognized API paths, table/bucket references and browser storage keys. Dynamic/unrecognized connections are explicitly not claimed as proven data flow.
- Validation: 18 focused tests, production build and mobile/desktop browser checks. Verified actual header source → categories API reference → API source → back. Guide-mode regression checks passed in three languages. Visual screenshot: `.source-library/source-evidence-mobile.png` in the release checkout.
