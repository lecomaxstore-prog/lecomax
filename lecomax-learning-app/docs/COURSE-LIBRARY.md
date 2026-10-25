# Course library

Open **More → Courses**. Switch to **My tools** for existing bookmarks, notes, review, flashcards and statistics.

| Path | Lessons |
| --- | ---: |
| Learn from your real site | 226 |
| Python | 16 |
| Next.js | 34 |
| APIs | 24 |
| Databases and SQL | 18 |
| JavaScript and React | 24 |
| Deployment | 17 |
| IPTV video application workshop | 10 |

Paths reuse existing lessons where topics overlap. These counts must not be summed as unique new lessons. Progress uses existing lesson IDs. The IPTV workshop adds ten original lessons in Arabic, English and French; the other paths organize the previously imported website curriculum.

The IPTV workshop builds a local Next.js video-on-demand project with a channel catalog, generated HLS demo media, JSON API, player, favorites, demonstration schedule, HTTP tests and production-build instructions. Live broadcasting and subscriptions are explicitly identified as extensions, not implemented features of the demo. Lesson snippets are studied in Learn and executed in the learner's separate project.

The API and schedule examples have executable regression tests. Media encoding, full tutorial-project deployment and native-device playback have not been automated in the Learn checks.

Technical references used while authoring:

- https://nextjs.org/docs/app/getting-started/route-handlers
- https://hlsjs.video-dev.org/api-docs/hls.js.hls
- https://ffmpeg.org/ffmpeg-formats.html

Refresh generated lessons using `npm.cmd run content`. The course library is defined in `constants/courses.ts`; the IPTV content is authored in `scripts/iptv-course.cjs`.
