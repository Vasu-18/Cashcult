## DollarSaver – Workflow Cost Impact Analytics

DollarSaver is a data-driven analytics platform that helps teams identify, prioritize, and reduce hidden cost inefficiencies across engineering workflows.
It converts structured workflow data into clear cost-impact insights, enabling smarter decisions about what to fix first.

The platform is designed for real-world use cases where teams deal with deployments, build failures, pull requests, tasks, and reviews—and need a simple but reliable way to understand where time and money are being lost.

## What Problem Does DollarSaver Solve?

Engineering teams often track workflow events (deployments, PRs, tasks, etc.) but lack visibility into:

Which failures or delays cost the most

Which workflow events should be prioritized first

How much total impact an upload or dataset represents

## DollarSaver solves this by:

1. Validating and parsing workflow CSV data

2. Calculating cost impact per record

3. Highlighting the highest cost-impact event

4. Providing a total cost impact summary per upload

## Key Features

📂 CSV Upload & Validation
Upload workflow-specific CSV files with strict schema checks.

📊 Cost Impact Analysis
Automatically calculates per-record and total cost impact.

🔝 Highest Impact Detection
Identifies the single most expensive workflow event per upload.

🔐 Secure Authentication
Authenticated access to uploads and insights.

📱 Responsive Dashboard
Clean, readable UI across desktop and mobile.

🔁 Multi-Workflow Support
Supports deployments, build failures, pull requests, tasks, and reviews.

## Supported Workflow Types

Each upload must contain one workflow type only:

Deployments

Build Failures

Pull Requests

Tasks

Reviews

Each workflow type has its own required CSV structure (documented in the Rules page).

## Tech Stack

## Frontend

Next.js

React

TypeScript

Tailwind CSS

## Backend

Appwrite (Database + Storage)

Data Parsing

PapaParse (CSV)

SheetJS (XLSX support)

Auth & Deployment

Appwrite Auth

Vercel

## How It Works (High Level)

1. User uploads a workflow CSV file

2. File is validated against the required schema

3. Data is parsed and normalized

4. Cost impact is calculated for each row

5. The highest-impact event is identified

6. Total cost impact is displayed in the dashboard

## Design Principles

1. Accuracy over assumptions

2. Clear prioritization, not raw noise

3. Simple inputs, meaningful outputs

4. Extensible for future workflow types

## Future Improvements

1. Historical trend analysis

2. Workflow comparison across uploads

3. Exportable insights reports

4. Team-level aggregation dashboards

## Who Is This For?

1. Engineering teams analyzing failures and delays

2. Operations teams prioritizing cost-heavy incidents

3. Product teams seeking data-backed optimization
