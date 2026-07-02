# Lectio-Intelligo

**Read. Understand. Believe.** — A Bible, Saints, & Catechism Quiz.

Lectio-Intelligo (*"I read, I understand"*) is a browser-based quiz game covering
**all 73 books of the Catholic Bible** (46 Old Testament, including the
deuterocanonical books, and 27 New Testament), the whole *Catechism of the
Catholic Church* across its eight sections, and the **saints through the ages**.

## Features

- **Choose your sources** — select any combination of the 73 Bible books
  (grouped by Pentateuch, Historical Books, Wisdom Books, Prophets, Gospels &
  Acts, Letters of St. Paul, and Catholic Letters & Revelation), the eight
  sections of the Catechism (two per part: Revelation, Scripture & Faith; the
  Creed; the Sacred Liturgy; the Seven Sacraments; Life in the Spirit; the Ten
  Commandments; Prayer in the Christian Life; and the Lord's Prayer), and five
  eras of the saints (the Apostolic Age, the Early Church, the Middle Ages,
  the Age of Reform, and the Modern Era). A **Select all sections** button
  turns on everything at once.
- **Two question styles**, both multiple choice:
  - **Conceptual** — questions about people, events, and doctrine.
  - **Fill in the blank** — complete a quoted verse or Catechism passage.
- **Quiz options** — pick 5, 10, 15, 20, 30, 50, or all available questions,
  and filter by question style. A progress filter can limit the quiz to only
  questions you haven't answered correctly yet, so you can work through the
  bank without repeats.
- **Instant feedback** with the Scripture or Catechism citation for every answer.
- **Results & review** — final score with a "for further study" list of any
  questions you missed.
- **Progress tracking** — every question you answer correctly is remembered in
  your browser's localStorage. The setup screen shows your overall percentage
  complete across the whole question bank, plus a percentage badge on each
  book, saint era, and Catechism section — and on every group header (the
  Pentateuch, the Prophets, and so on), all green when fully mastered. A
  discreet **Reset progress** button clears the saved history.
- **Keyboard play** — press 1–4 to answer, Enter to advance.

## Running the game

No build step or server is required — it is plain HTML, CSS, and JavaScript.

Open `index.html` in any modern browser, or serve the folder locally:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Hosting on GitHub Pages

Because the game is a static site with `index.html` at the repository root, it
can be published with GitHub Pages in a couple of clicks:

1. Merge this branch into `main` (or push the files to `main`).
2. On GitHub, open **Settings → Pages** for the repository.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch",
   choose the `main` branch and the `/ (root)` folder, and click **Save**.
4. After a minute or two, the game will be live at
   `https://<your-username>.github.io/Lectio-Intelligo/`.

Every later push to `main` republishes the site automatically.

## Project structure

```
index.html      – app shell (setup, quiz, and results screens)
css/style.css   – styling
js/data.js      – question bank and source groups
js/app.js       – game logic
```

## Adding questions

Add entries to `QUESTION_BANK` in `js/data.js`:

```js
{ src: "Genesis",            // a Bible book, saint era, or CCC section listed in SOURCE_GROUPS
  type: "conceptual",        // "conceptual" or "fill"
  q: "Question text (use ____ for the blank)",
  choices: ["correct answer", "wrong", "wrong", "wrong"], // first is correct
  ref: "Genesis 1:1" }       // citation shown with feedback
```

Choices are shuffled at runtime, and books only appear in the setup screen when
they have at least one question.
