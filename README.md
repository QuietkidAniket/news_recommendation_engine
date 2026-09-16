<div align="center">
  
  <h1>News Recommendation Engine</h1>
  <p><i>A highly scalable, personalized NoSQL backend architecture for real-time content curation and telemetry logging.</i></p>

  <img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Framework-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Driver-Motor_(Async)-333333?style=for-the-badge" alt="Motor" />
  <img src="https://img.shields.io/badge/Validation-Pydantic_V2-E92063?style=for-the-badge&logo=pydantic&logoColor=white" alt="Pydantic" />

</div>

<br>

## System Overview

This project implements a robust RESTful API designed to dynamically ingest unstructured news articles, monitor continuous streams of user reading history, and compute tag-based content recommendations at minimal latency. The system leverages advanced MongoDB aggregation pipelines to execute complex data transformations strictly at the database layer.

## Core Capabilities

*   **Real-Time Data Ingestion:** Comprehensive CRUD endpoints engineered to manage high-volume news articles and dynamic user profile schemas.
*   **Algorithmic Recommendation Engine:** Utilizes optimized `$match` and `$in` aggregation pipelines to intersect user array preferences with live article metadata tags.
*   **Global Trending Metrics:** Computes high-performing platform content utilizing structured `$sort` and `$limit` aggregations based on real-time view counts.
*   **Reading Telemetry Logging:** Maintains chronological user clickstreams with precise `$lookup` joins, fetching contextual article data without client-side processing overhead.
*   **Query Optimization:** Employs strategic multi-key indexes on embedded arrays and compound indexes on relational object identifiers to prevent collection scans and ensure consistent query retrieval performance.

## Installation and Deployment

**1. Repository Initialization**
```bash
git clone <your-github-repo-url>
cd news-recommendation-engine

```

**2. Environment Configuration**

```bash
python3 -m venv venv
source venv/bin/activate

```

**3. Dependency Installation**

```bash
pip install fastapi uvicorn motor pydantic

```

**4. Database Connectivity**
Navigate to `database.py` and configure the `MONGO_DETAILS` connection string with the designated local MongoDB URI or MongoDB Atlas cluster credentials.

**5. Database Seeding**
Initialize the schema and populate the collections with strictly formatted sample data:

```bash
python seed.py

```

**6. Index Generation**
Construct the multi-key and compound indexes required for optimal aggregation performance:

```bash
python optimize.py

```

**7. Server Execution**
Start the asynchronous ASGI server:

```bash
uvicorn main:app --reload

```

The interactive API documentation (Swagger UI) will render at `http://127.0.0.1:8000/docs`.

## Project Contributors

* **Aniket Kundu** – Backend Architecture & NoSQL Data Modeling
* **Shubhansh Nigam** – REST API Development & Aggregation Pipelines
