<div align="center">
  
  <h1>News Recommendation Engine</h1>
  <p><i>A highly scalable, personalized NoSQL full-stack platform for real-time content curation and telemetry logging.</i></p>

  <img src="https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Framework-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Driver-Motor_(Async)-333333?style=for-the-badge" alt="Motor" />
  <img src="https://img.shields.io/badge/Validation-Pydantic_V2-E92063?style=for-the-badge&logo=pydantic&logoColor=white" alt="Pydantic" />
  <img src="https://img.shields.io/badge/Frontend-Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Styling-Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />

</div>

<br>

## System Overview

The News Recommendation Engine is an asynchronous full-stack web application designed to ingest unstructured news articles, track real-time user reading telemetry, and compute personalized tag-based recommendations at sub-millisecond database latencies.

Rather than running heavy in-memory filtering or joining algorithms on backend workers, the system executes complex data transformations directly within MongoDB Aggregation Pipelines, backed by a high-throughput FastAPI ASGI backend and a reactive Next.js 16 dashboard.

---

## Core Capabilities

* Personalized Recommendations: Uses $match and $in aggregation pipelines to intersect user array preferences with live article metadata tags, sorted by popularity.
* Global Real-Time Trending: Computes top platform stories utilizing $sort and $limit aggregations indexed over real-time view counts.
* **Relational Telemetry Tracking ($lookup):** Maintains chronological user reading clickstreams with database-level joins, attaching article metadata without client-side $N+1$ query overheadInteractive Reading Telemetry:y:** One-click "Read" interaction on the client immediately increments article view counters and appends entries to ReadingHistoriesMulti-Key & Compound Indexing:g:** Utilizes targeted indexes on embedded tag arrays, view counts, and relational foreign keys to eliminate full collection scans (COLLSCAN)Dual-View Dashboard:d:** Responsive client featuring an end-user personalized feed ("For You", "Trending", "History") and an Admin Management Console for articles and users.

---

## Architecture & Data Flow

```mermaid
  flowchart TD
    subgraph Client ["Frontend (Next.js 16 + Tailwind CSS)"]
        Feed["Personalized Feed & Trending"]
        History["Clickstream Reading History"]
        Admin["Admin Management Panel"]
    end

    subgraph Backend ["Backend API (FastAPI + Pydantic V2)"]
        Router["RESTful Route Handlers"]
        MotorDriver["Motor Async Driver (Non-blocking I/O)"]
    end

    subgraph Database ["Data Tier (MongoDB Atlas NoSQL)"]
        UsersCol[("Users Collection")]
        ArticlesCol[("Articles Collection")]
        HistoryCol[("ReadingHistories Collection")]
    end

    Client <-->|HTTP REST / JSON| Router
    Router <--> MotorDriver
    MotorDriver <--> UsersCol
    MotorDriver <--> ArticlesCol
    MotorDriver <--> HistoryCol
```

## REST API Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | / | Service health status check |
| GET | /db-status | Live ping check against MongoDB Atlas cluster |
| GET | /articles/ | List all articles in the database |
| POST | /articles/ | Create a new article with title and tags |
| GET | /articles/{id} | Retrieve details for a single article |
| PUT | /articles/{id} | Update an article title |
| DELETE | /articles/{id} | Delete an article |
| POST | /articles/{id}/read | Log a user reading event and increment view count |
| GET | /articles/trending/ | Top 5 trending articles ordered by views ($sort, $limit) |
| GET | /users/ | List all registered user profiles |
| POST | /users/ | Register a new user with preferred tag interests |
| DELETE | /users/{id} | Delete a user profile |
| GET | /users/{id}/recommendations | Top 5 personalized articles based on tag matching |
| GET | /users/{id}/history | Chronological reading history joined with article details ($lookup) |

---

## Installation & Setup

### Prerequisites
* Python 3.10+
* Node.js 18+ and npm
* MongoDB Atlas cluster or local MongoDB instance

---

### 1. Backend Setup

# Clone the repository
git clone <your-github-repo-url>
cd news-recommendation-engine

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install fastapi uvicorn motor pydantic

# Configure database connection
  * Open database.py and set your MONGO_DETAILS connection string:
  
  * MONGO_DETAILS = "mongodb+srv://<user>:<password>@cluster.mongodb.net/..."

  * Seed database with sample users, articles, and history

  * python seed_script.py

## Generate multi-key and compound indexes for query optimization

python optimize.py

# Launch the FastAPI ASGI server
uvicorn main:app --reload --host 127.0.0.1 --port 8000* Interactive API Documentation (Swagger UI): http://127.0.0.1:8000/docs
* Alternative API Documentation (ReDoc): http://127.0.0.1:8000/redoc

---

### 2. Frontend Setup

In a separate terminal:

cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
```npm run dev``` 

* Frontend Dashboard: Open http://localhost:3000 in your browser.

---

## Database Indexing Strategy (optimize.py)

To ensure high-throughput read/write operations under load, the following indexes are maintained:

1. **Multi-key Index on Articles.tags (ASCENDING)**: Eliminates collection scans when matching articles against user interest arrays ($in: user_tags).
2. **Single-Field Index on Articles.views (DESCENDING)**: Accelerates sorting for trending calculations without memory sort limits.
3. **Compound Index on ReadingHistories (userId: ASC, readAt: DESC)**: Optimizes user-specific history retrieval and chronological ordering.

---
