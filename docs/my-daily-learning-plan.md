# My simple learning program

Start: Wednesday, 23 September 2026.
Time: 9:00–9:45 AM every day, Europe/Paris time.
Goal: understand your shop and build a small practice shop yourself.

Start here each day. The longer guides are reference books: you do not need to read everything at once.

## The same easy routine every day

| Minutes | What I do |
| --- | --- |
| 0–5 | Remember one thing from yesterday |
| 5–15 | Learn one new idea |
| 15–35 | Try one small exercise |
| 35–40 | Find a mistake or answer a question |
| 40–45 | Write what I learned and stop |

One idea. One example. One exercise. That is enough for a day.

Every seventh session is a review day. If a lesson is difficult, repeat it the next day. If you miss a day, continue from your last unfinished lesson. Do not double the next session. These are session numbers, not deadlines. Six weeks is a first foundation, not a promise of mastery.

## Tomorrow: Day 1, understand what a website is

You only need your editor and this guide. No database setup tomorrow.

**Minutes 0–5:** Open your L'ecomax project. Find the `app` and `components` folders. Do not change the real shop yet.

**Minutes 5–15:** Learn these three words:

- **Page:** a screen you visit, such as the homepage.
- **Component:** a reusable piece of that screen, such as a product card.
- **Database:** a place that remembers information, such as product names and prices.

Think of your shop: the homepage is a page; each product card is a component; the saved product records live in a database.

**Minutes 15–25:** Open `app/page.tsx`. Find the word `HeroBanner`. Open `components/HeroBanner.tsx`. You have followed a connection between two files. You do not need to understand all their code.

**Minutes 25–35:** On paper, draw a shop page with a heading and two product cards. Circle the two cards. Those are pieces you could reuse.

**Minutes 35–40:** Answer aloud: “What is the difference between a page and a component?”

**Minutes 40–45:** Write: “Today I found the homepage file. A component is a reusable piece of a screen.” Change the sentence to your own words, then stop.

Success means you can explain those three words. You do not need to write code on Day 1.

## Your first 42 sessions

Tick a day only after trying its exercise. If you need help, come back and say: “Teach me Day 4, very slowly.”

### Week 1: feel comfortable

| Done | Day | One idea | Small exercise |
| --- | --- | --- | --- |
| [ ] | 1 | Page, component, database | Follow the Day 1 steps above |
| [ ] | 2 | A file holds instructions | Find app/page.tsx, app/layout.tsx and components/HeroBanner.tsx; describe each in one sentence |
| [ ] | 3 | HTML describes content | Write a heading and paragraph in a scratch .html file; open it in your browser |
| [ ] | 4 | CSS changes appearance | Change the heading color and add space around your scratch page |
| [ ] | 5 | A card groups information | Make a pretend product card with a name and price |
| [ ] | 6 | A layout arranges cards | Put two cards beside each other; check a narrow window |
| [ ] | 7 | Review | Explain your card and repeat the hardest exercise |

### Week 2: understand JavaScript

| Done | Day | One idea | Small exercise |
| --- | --- | --- | --- |
| [ ] | 8 | A variable remembers a value | Write const price = 120 and calculate price * 2 in a scratch exercise |
| [ ] | 9 | A function performs a job | Write a function that calculates price times quantity |
| [ ] | 10 | A condition chooses what happens | Show “Available” when stock is greater than zero |
| [ ] | 11 | An object groups details | Describe one product with name and price properties |
| [ ] | 12 | An array is a list | Make a list of three pretend products |
| [ ] | 13 | A bug is a mismatch to investigate | Predict a total, intentionally change a value, and explain the new result |
| [ ] | 14 | Review | Rebuild a tiny price calculation without copying |

### Week 3: React and your first Next.js pages

| Done | Day | One idea | Small exercise |
| --- | --- | --- | --- |
| [ ] | 15 | Local practice is separate from the live shop | Create the separate practice app using section 2 of the Supabase guide; open its local page |
| [ ] | 16 | JSX describes a React screen | Type the tiny page from Mission 1 of the Next.js guide |
| [ ] | 17 | A component can be reused | Display the same practice product card twice |
| [ ] | 18 | Props pass values to components | Give the two cards different product names |
| [ ] | 19 | State remembers changing screen values | Try the quantity counter from Mission 2 |
| [ ] | 20 | A route is a page address | Create /practice and connect to it with a Link |
| [ ] | 21 | Review | Explain what happens when your counter button is clicked |

### Week 4: understand stored data

| Done | Day | One idea | Small exercise |
| --- | --- | --- | --- |
| [ ] | 22 | Tables, rows and columns | Draw a products table on paper with three products |
| [ ] | 23 | Supabase hosts your database | Create a separate Supabase practice project and find its SQL Editor |
| [ ] | 24 | SQL instructs the database | Run the table setup in section 3 of the Supabase guide; read each explanation |
| [ ] | 25 | SELECT reads rows | Query the three fake products |
| [ ] | 26 | INSERT adds a row | Add one fake backpack and keep its ID |
| [ ] | 27 | UPDATE changes a row | Change only that backpack's price using its ID |
| [ ] | 28 | Review | Explain why a row ID helps you edit the correct product |

### Week 5: connect your app to your database

| Done | Day | One idea | Small exercise |
| --- | --- | --- | --- |
| [ ] | 29 | Permissions decide allowed access | Explain why visitors should read public products but not edit their prices |
| [ ] | 30 | Configuration tells the app where to connect | Follow section 5 of the Supabase guide; use your practice URL and publishable key |
| [ ] | 31 | An API receives requests | Build the small GET route in section 6; stop after this exercise |
| [ ] | 32 | JSON carries the result | Open your local API URL and identify one product name |
| [ ] | 33 | fetch asks an API for data | Build the practice page in section 7; click Load products |
| [ ] | 34 | Requests can fail | Misspell the practice table name, inspect the error, then restore it |
| [ ] | 35 | Review | Draw browser → API → database → response → screen |

### Week 6: understand your real shop

| Done | Day | One idea | Small exercise |
| --- | --- | --- | --- |
| [ ] | 36 | Server and browser have different jobs | Find a use client directive and explain why that component is interactive |
| [ ] | 37 | Forms send values | Draw the steps needed to submit a new category |
| [ ] | 38 | The server checks permission and input | Read the guided tour of your category POST handler in section 9 |
| [ ] | 39 | Orders connect several records | Draw one order with two order-item rows |
| [ ] | 40 | Debugging follows evidence | Explain the 4-digit versus 8-character access-code mismatch from your guide |
| [ ] | 41 | Build a small complete feature | Load products and add a local quantity counter in your practice app |
| [ ] | 42 | Review and choose what comes next | Demonstrate the practice feature and explain where its data comes from |

## After Day 42

Keep the 45-minute routine. Choose one small project per week: a login page, private notes, a product photo upload, a validated form, pagination, or a practice deployment. Break each project into tiny steps. Use the seventh session to review. Continue until you can explain and rebuild what you made.

## Your two reference books

- [Next.js and your real shop](./learn-nextjs-from-zero.md)
- [Supabase and APIs](./learn-supabase-and-apis.md)

If a reference feels difficult, ask for just the next five lines of code to be explained. You do not need to understand an entire file at once.

## Ask me to teach this way

Copy this when you return:

> Teach me Day 1 of my daily learning plan. I am a complete beginner. Use very simple English. Explain one idea with an example from my shop. Give me one small exercise and wait for my answer. Explain every new word. Help me understand my mistake before showing the answer. Keep the whole session within 45 minutes.

Change Day 1 to your current day. If needed, say: “Make that simpler” or “Show me another example.”

## My daily notes

Copy these four lines each day:

```text
Day:
Today I tried:
I can now explain:
I still need help with:
```

## Daily reminder

Reminder text: “Time to learn! 45 minutes, one small step. Open your daily learning plan and continue from your last unfinished day.”

The accompanying [calendar file](./daily-learning-reminder.ics) uses your chosen time: 9:00–9:45 AM Europe/Paris starting 23 September 2026, repeating daily with no end date. The file is not an active notification: import it into your calendar, check the time and alert, and enable calendar notifications. Calendar apps may handle imported alarms differently. Import it only once to avoid duplicate reminders. You can stop the reminders by deleting the recurring event in your calendar.

No automatic reminder has been activated by creating this document.
