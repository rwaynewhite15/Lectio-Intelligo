# Lectio-Intelligo

**Read. Understand. Believe.** — A Catholic Bible & Catechism quiz game.

Lectio-Intelligo (*"I read, I understand"*) is a browser-based quiz game covering
the books of the Catholic Bible (including the deuterocanonical books) and the
four parts of the *Catechism of the Catholic Church*.

## Features

- **Choose your sources** — select any combination of Bible books (grouped by
  Pentateuch, Historical Books, Wisdom Books, Prophets, Gospels & Acts, and
  Epistles & Revelation) and the four parts of the Catechism (the Creed, the
  Sacraments, Life in Christ, and Christian Prayer).
- **Two question styles**, both multiple choice:
  - **Conceptual** — questions about people, events, and doctrine.
  - **Fill in the blank** — complete a quoted verse or Catechism passage.
- **Quiz options** — pick 5, 10, 15, 20, or all available questions, and filter
  by question style.
- **Instant feedback** with the Scripture or Catechism citation for every answer.
- **Results & review** — final score with a "for further study" list of any
  questions you missed.
- **Keyboard play** — press 1–4 to answer, Enter to advance.

## Running the game

No build step or server is required — it is plain HTML, CSS, and JavaScript.

Open `index.html` in any modern browser, or serve the folder locally:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

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
{ src: "Genesis",            // a Bible book or CCC part listed in SOURCE_GROUPS
  type: "conceptual",        // "conceptual" or "fill"
  q: "Question text (use ____ for the blank)",
  choices: ["correct answer", "wrong", "wrong", "wrong"], // first is correct
  ref: "Genesis 1:1" }       // citation shown with feedback
```

Choices are shuffled at runtime, and books only appear in the setup screen when
they have at least one question.
