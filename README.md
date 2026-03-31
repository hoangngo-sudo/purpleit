# *purpleit* project

A Reddit-style community post board built with React 18 + Vite. Features Google OAuth authentication, real-time upvoting, threaded comments, user profiles, and image uploads via Supabase backend.

**Live site**: [https://hoangngo-sudo.github.io/purpleit/](https://hoangngo-sudo.github.io/purpleit/)

## Demo

https://github.com/user-attachments/assets/a7d65327-f1da-40e8-ac16-aed48a87d614

## Architecture

```mermaid
flowchart TB
    USER([User]) --> HOME["HomePage<br/>Post feed with search/sort"]
    HOME --> |Click post| DETAIL["DetailPage<br/>Full post + comments"]
    HOME --> |Click Create| CREATE["CreatePage<br/>(Protected)"]
    HOME --> |Click avatar| PROFILE["ProfilePage<br/>User activity tabs"]

    DETAIL --> |Upvote| RPC[("Supabase RPC<br/>toggle_upvote")]
    DETAIL --> |Comment| COMMENTS[("comments table")]
    DETAIL --> |Edit| EDIT["EditPage<br/>(Protected, Owner only)"]
    DETAIL --> |Delete| DELETE["Confirm Modal"]
    DELETE --> |Confirm| SUPA_DEL[("DELETE posts")]

    CREATE --> |Submit| SUPA_INS[("INSERT posts")]
    CREATE --> |Upload image| STORAGE[("Supabase Storage<br/>post-images bucket")]
    EDIT --> |Submit| SUPA_UPD[("UPDATE posts")]
    EDIT --> |Upload image| STORAGE

    USER --> |Not logged in| LOGIN["LoginPage"]
    LOGIN --> |Google OAuth| AUTH[("Supabase Auth")]
    AUTH --> |Success| HOME

    PROFILE --> |Overview| POSTS_TAB["User's Posts"]
    PROFILE --> |Comments| COMMENTS_TAB["User's Comments"]
    PROFILE --> |Upvoted| UPVOTED_TAB["Upvoted Posts"]
```

## Features

- **Google OAuth authentication** Sign in with Google, user profiles, avatar display in navbar and post cards
- **Community post board** Create posts with title, content, and images (URL or file upload); browse with infinite scroll pagination
- **Server-side search & sort** Debounced search by title (300ms), sort by date or upvotes, all executed on Supabase
- **Toggle upvotes** Upvote/un-upvote posts with optimistic UI; server-authoritative state via Supabase RPC
- **Threaded comments** Nested replies up to 5 levels deep with collapsible threads, visual connector lines, inline reply forms, and OP badges for post author comments
- **User profiles** Tabbed activity view showing posts, comments, and upvoted content
- **Author-based ownership** Only post owners can edit/delete; multi-layer auth guards (route, component, action, server)
- **Protected routes** Create and Edit pages require authentication; automatic redirect with toast notification
- **Image uploads** Drag-and-drop zone with preview (50MB max), or paste external URL; stored in Supabase Storage
- **Toast notifications** Context-based system with animated entry/exit (success, error, info types)
- **Responsive design** Bootstrap 5 with custom indigo color scheme and Inter font

## Tech Stack

```mermaid
graph TD
    subgraph External
        SUPA["Supabase<br/>PostgreSQL + Auth + Storage"]
        GOOGLE["Google OAuth<br/>Authentication provider"]
        BOOTSTRAP["Bootstrap 5.3<br/>cdn.jsdelivr.net"]
        ICONS["Bootstrap Icons 1.13<br/>cdn.jsdelivr.net"]
    end

    subgraph "Build Tools"
        VITE["Vite 7<br/>Dev server + bundler"]
        REACT_PLUGIN["@vitejs/plugin-react<br/>Fast refresh"]
        ESLINT["ESLint 9<br/>Linting"]
    end

    subgraph "React App"
        MAIN["main.jsx<br/>Entry point"]
        PROVIDERS["AuthProvider → ToastProvider<br/>→ BrowserRouter"]
        APP["App.jsx<br/>Layout + navbar"]
        ROUTES["Route Components<br/>HomePage, DetailPage, etc."]
        COMPONENTS["Shared Components<br/>Post, CommentThread,<br/>ImageDropZone, ProtectedRoute"]
    end

    subgraph "Utilities"
        CLIENT["client.js<br/>Supabase singleton"]
        HELPERS["helpers.js<br/>formatTime, uploadImage,<br/>buildCommentTree"]
    end

    MAIN --> PROVIDERS
    PROVIDERS --> APP
    APP --> ROUTES
    ROUTES --> COMPONENTS
    ROUTES --> HELPERS
    HELPERS --> CLIENT
    CLIENT --> SUPA
    APP --> SUPA
    PROVIDERS --> GOOGLE
```

| Dependency | Purpose |
|---|---|
| React 18 | UI framework with StrictMode |
| React Router 6 | Client-side routing with outlet context |
| [@supabase/supabase-js](https://supabase.com/docs/reference/javascript) | Database, auth, and storage client |
| [Bootstrap 5.3](https://getbootstrap.com/) | CSS/JS UI kit |
| [Bootstrap Icons](https://icons.getbootstrap.com/) | Icon font |
| Vite 7 | Build tool with HMR |
| Github Pages | GitHub Pages deployment |

## Build

```bash
npm install
npm run dev
```

Before running, create a `.env` file from `.env.example` and set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

For production build:

```bash
npm run build
npm run preview
```

For GitHub Pages deployment:

```bash
npm run deploy
```

## Project Structure

```
.
├── src/
│   ├── main.jsx              # Entry point, provider setup
│   ├── App.jsx               # Root layout, navbar, outlet
│   ├── index.css             # Global styles, indigo theme
│   ├── routes/
│   │   ├── HomePage.jsx      # Post feed with infinite scroll
│   │   ├── DetailPage.jsx    # Single post view + comments
│   │   ├── CreatePage.jsx    # New post form (protected)
│   │   ├── EditPage.jsx      # Edit post form (protected)
│   │   ├── LoginPage.jsx     # Google OAuth login
│   │   └── ProfilePage.jsx   # User profile with tabs
│   ├── components/
│   │   ├── Post.jsx          # Post card component
│   │   ├── CommentThread.jsx # Recursive threaded comments
│   │   ├── ProtectedRoute.jsx# Auth guard wrapper
│   │   └── ImageDropZone.jsx # Drag-drop upload zone
│   ├── contexts/
│   │   ├── AuthContext.jsx   # Google OAuth provider
│   │   ├── useAuth.js        # Auth hook
│   │   ├── ToastContext.jsx  # Toast notification provider
│   │   └── useToast.js       # Toast hook
│   └── utils/
│       ├── client.js         # Supabase client singleton
│       └── helpers.js        # Shared utilities
├── public/
│   └── netlify.toml          # SPA redirect config
└── vite.config.js            # Base path: /purpleit/
```

## Component & Data Flow

```mermaid
graph LR
    main["main.jsx"] --> AuthProvider
    AuthProvider --> ToastProvider
    ToastProvider --> Router["BrowserRouter"]
    Router --> App

    App -->|"Outlet context"| HomePage
    App -->|"useAuth()"| AuthCtx["AuthContext"]

    HomePage -->|"props"| Post["Post.jsx"]
    HomePage -->|"SELECT posts<br/>+ profiles join"| DB[(Supabase)]

    DetailPage -->|"buildCommentTree()"| CommentThread["CommentThread.jsx<br/>(recursive)"]
    DetailPage -->|"RPC toggle_upvote"| DB
    DetailPage -->|"comments CRUD"| DB

    CreatePage -->|"INSERT posts"| DB
    CreatePage -->|"upload"| Storage[(Storage)]

    EditPage -->|"UPDATE posts"| DB
    EditPage -->|"upload"| Storage

    ProfilePage -->|"SELECT posts,<br/>comments, upvotes"| DB

    LoginPage -->|"signInWithOAuth"| Auth[(Supabase Auth)]
```

## Database Schema

```mermaid
erDiagram
    profiles ||--o{ posts : "creates"
    profiles ||--o{ comments : "writes"
    profiles ||--o{ upvotes : "gives"
    posts ||--o{ comments : "has"
    posts ||--o{ upvotes : "receives"
    profiles {
        uuid id PK "User ID from Supabase Auth"
        text username "Display name from Google"
        text avatar_url "Profile picture URL"
        timestamptz created_at "Account creation timestamp"
    }
    posts {
        text user_id PK "Random generated post ID"
        text title "Post title (required)"
        text content "Post body text (optional)"
        text imageUrl "Image URL or Storage path"
        int upvotes "Upvote count (default 0)"
        uuid author_id FK "References profiles.id (nullable)"
        timestamptz created_at "Post creation timestamp"
        timestamptz updated_at "Last edit timestamp (nullable)"
    }
    comments {
        int id PK "Auto-increment comment ID"
        text post_id FK "References posts.user_id"
        text comment "Comment text content"
        uuid author_id FK "References profiles.id (nullable)"
        int parent_id FK "References comments.id for threading"
        bool is_deleted "Soft delete preserves thread structure"
        timestamptz created_at "Comment timestamp"
    }
    upvotes {
        uuid user_id FK "References profiles.id"
        text post_id FK "References posts.user_id"
        timestamptz created_at "Upvote timestamp"
    }
```

**Key Tables:**

| Table | Purpose | Notes |
|---|---|---|
| `profiles` | User profile data | Populated via Supabase Auth trigger on Google sign-in |
| `posts` | Community posts | `author_id` is nullable for legacy anonymous posts |
| `comments` | Threaded comments | `parent_id` enables nested replies; `is_deleted` preserves thread structure |
| `upvotes` | User upvote tracking | Composite key on `(user_id, post_id)` prevents duplicate upvotes |

**Supabase Storage:**
- **Bucket:** `post-images` (public)
- **Purpose:** Store uploaded post images
- **Max size:** 50MB per image

**Supabase RPC Functions:**
- **`toggle_upvote(p_post_id text)`** Atomically toggles upvote state and returns authoritative count

## Threaded Comments

```mermaid
flowchart TD
    subgraph "Data Layer"
        DB[(comments table)]
        DB -->|"SELECT with parent_id"| FLAT["Flat comment array"]
    end
    subgraph "Transformation"
        FLAT -->|"buildCommentTree()"| TREE["Nested tree structure"]
        TREE -->|"Each node has"| NODE["{ ...comment, children[], depth }"]
    end
    subgraph "Rendering"
        NODE --> CT1["CommentThread depth 0"]
        CT1 -->|"recursive"| CT2["CommentThread depth 1"]
        CT2 -->|"recursive"| CT3["...up to depth 5"]
    end
```

**Features:**
- Recursive `CommentThread` component renders nested replies
- Visual thread lines connect parent-child comments
- Collapsible threads with reply count
- Inline reply forms with auth guard
- OP badge for post author comments
- Soft-deleted comments show `[Comment Deleted]` preserving thread structure

## Auth Flow

```mermaid
sequenceDiagram
    participant U as User
    participant LP as LoginPage
    participant AP as AuthProvider
    participant SA as Supabase Auth
    participant SP as profiles table

    U->>LP: Click "Sign in with Google"
    LP->>AP: signInWithGoogle()
    AP->>SA: signInWithOAuth({ provider: 'google' })
    SA-->>U: Redirect to Google OAuth
    U-->>SA: Authorize & redirect back
    SA->>AP: onAuthStateChange(session)
    AP->>SP: SELECT profile WHERE id = user.id
    SP-->>AP: { username, avatar_url }
    AP-->>LP: Redirect to HomePage
```

## License

MIT
