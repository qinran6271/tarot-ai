## Product Vision
Most AI tarot applications generate a single interpretation and stop there. I wanted to build something closer to a real tarot consultation, where one reading becomes an ongoing conversation. Users can explore the same topic through follow-up questions, and each consultation is preserved as a personal journal rather than just another chat.

## Current Architecture (MVP)

### Reading Flow

The current MVP follows this flow:

```text
Home
  ↓
Question
  ↓
Choose Spread
  ↓
Draw Cards
  ↓
AI Reading
  ↓
History
```

### Home

- Daily Reading
- Start a new reading

### Question

The user enters a question for the tarot reading.

### Spread

The user manually selects a tarot spread.

Currently supported:

- Daily Reading
- Single Card
- Three-card Reading

### Cards

The user draws cards by revealing randomly selected tarot cards.

### AI Reading

The AI generates a structured interpretation including:

- Key Insight
- Interpretation
- Advice
- Suggested Follow-up Questions

### History

Completed readings are stored locally using localStorage.

## Target Architecture

The application will gradually evolve from a one-time reading experience into a complete tarot consultation.

The planned consultation flow is:

```text
Home
  │
  ├── Daily Reading
  │
  └── Start New Reading
          │
          ▼
      Set Focus
          │
          ▼
AI Recommends a Spread
          │
          ▼
   User Confirms Spread
          │
          ▼
      Draw Cards
          │
          ▼
    Initial Reading
          │
          ▼
Follow-up Conversation
          │
          ▼
Need Clarification?
      │                   │
     Yes                  No
      │                   │
      ▼                   ▼
Draw Clarification   Finish Reading
      │                 │
      └─────────┐       ▼
                ▼
     Continue Conversation
                │
                ▼
        Session Summary
                │
                ▼
         Tarot Journal
```

### Focus
A focus is the core question of a reading session.

It defines what the entire consultation is centered around.

Unlike a one-time question, the focus can support follow-up questions within the same session.

Example:

- Focus: Will England win the championship?
- Follow-up: Why might they fail?
- Follow-up: What do they need to improve?
- Follow-up: What is the biggest obstacle?

### Follow-up Conversation
After the initial reading, the user can continue asking questions based on the same cards.

The AI continues interpreting the existing spread instead of starting a new reading.

### Clarification Card
If the existing cards are insufficient to answer a follow-up question, the AI may recommend drawing a clarification card.

### Tarot Journal
Each completed consultation is saved as a journal entry containing:

- Focus
- Cards
- Conversation
- Final Summary


## Session Lifecycle

A reading is stored as a single session.

The session is created immediately after the initial tarot reading is generated.

```
User starts a reading
        ↓
Create Reading Session
        ↓
Save initial cards
        ↓
Save initial AI interpretation
        ↓
Session status = Active
```

During the consultation:

- Every follow-up question is appended to the current session.
- Every AI response is appended to the same session.
- If a clarification card is drawn, it is also recorded in the same session.

When the user chooses to finish the consultation:

```
Finish Reading
        ↓
Generate Session Summary
        ↓
Update Session
        ↓
Status = Completed
        ↓
Save to Tarot Journal
```

The session remains editable while it is active. Once completed, it becomes a journal entry that can be viewed later from the history page.

Reading Session
```text
┌──────────────────────────────────┐
│ Reading Session                  │
├──────────────────────────────────┤
│ Focus                            │
│ "Career uncertainty"             │
├──────────────────────────────────┤
│ Spread                           │
│ Three-card Reading               │
├──────────────────────────────────┤
│ Cards                            │
│ • The Hermit                     │
│ • Justice (Reversed)             │
│ • The Star                       │
│ • Clarification Card (Optional)  │
├──────────────────────────────────┤
│ Conversation                     │
│ User                             │
│ Assistant (Initial Reading)      │
│ User                             │
│ Assistant                        │
│ User                             │
│ Assistant                        │
├──────────────────────────────────┤
│ Session Summary                  │
├──────────────────────────────────┤
│ Status                           │
│ Active / Completed               │
└──────────────────────────────────┘
```

## Technical Architecture

### Frontend

- Next.js (App Router)
- React
- Tailwind CSS

### State Management

The application uses Zustand to manage client-side state.

Current global state includes:

- current reading
- selected cards
- user focus
- reading history

### AI Integration

The application communicates with OpenAI through a Next.js API Route.

Flow:

User Input
↓
Next.js API Route
↓
OpenAI API
↓
Structured Reading
↓
Frontend Rendering

### Data Storage

Current

- localStorage
- Zustand

Planned

- PostgreSQL
- Drizzle ORM
- User authentication
- Cloud synchronization

### Project Structure

app/
    page.tsx
    question/
    cards/
    reading/

components/

store/

lib/

types/

### Planned AI Workflow

The AI system will eventually be divided into several responsibilities:

- Initial Reading
- Follow-up Conversation
- Session Summary

These responsibilities may later be implemented as independent prompts or AI agents.