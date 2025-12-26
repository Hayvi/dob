# Forzza Scraper - API Endpoints Documentation

This document provides all available HTTP endpoints for your live scraper. 

**Production Base URL:** `https://dob-lqpg.onrender.com`

---

## 🚀 Live Extraction Links (Every Sport)

Click any of the links below to trigger a **fresh, high-speed extraction** for that specific sport. This will update your MongoDB database with the latest prematch data.

| Sport Name | Live Extraction Link (Click to Start Scrape) |
| :--- | :--- |
| **Football** | [Scrape Football (ID: 1)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=1&sportName=Football) |
| **Ice Hockey** | [Scrape Ice Hockey (ID: 2)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=2&sportName=Ice_Hockey) |
| **Basketball** | [Scrape Basketball (ID: 3)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=3&sportName=Basketball) |
| **Tennis** | [Scrape Tennis (ID: 4)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=4&sportName=Tennis) |
| **Volleyball** | [Scrape Volleyball (ID: 5)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=5&sportName=Volleyball) |
| **American Football** | [Scrape American Football (ID: 6)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=6&sportName=American_Football) |
| **Aussie Rules** | [Scrape Aussie Rules (ID: 8)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=8&sportName=Aussie_Rules) |
| **Bandy** | [Scrape Bandy (ID: 10)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=10&sportName=Bandy) |
| **Baseball** | [Scrape Baseball (ID: 11)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=11&sportName=Baseball) |
| **Chess** | [Scrape Chess (ID: 18)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=18&sportName=Chess) |
| **Cricket** | [Scrape Cricket (ID: 19)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=19&sportName=Cricket) |
| **Curling** | [Scrape Curling (ID: 20)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=20&sportName=Curling) |
| **Cycling** | [Scrape Cycling (ID: 21)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=21&sportName=Cycling) |
| **Darts** | [Scrape Darts (ID: 22)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=22&sportName=Darts) |
| **Floorball** | [Scrape Floorball (ID: 24)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=24&sportName=Floorball) |
| **Formula 1** | [Scrape Formula 1 (ID: 25)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=25&sportName=Formula_1) |
| **Futsal** | [Scrape Futsal (ID: 26)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=26&sportName=Futsal) |
| **Golf** | [Scrape Golf (ID: 27)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=27&sportName=Golf) |
| **Handball** | [Scrape Handball (ID: 29)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=29&sportName=Handball) |
| **Lacrosse** | [Scrape Lacrosse (ID: 110)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=110&sportName=Lacrosse) |
| **Rugby League** | [Scrape Rugby League (ID: 36)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=36&sportName=Rugby_League) |
| **Rugby Union** | [Scrape Rugby Union (ID: 37)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=37&sportName=Rugby_Union) |
| **Snooker** | [Scrape Snooker (ID: 39)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=39&sportName=Snooker) |
| **Table Tennis** | [Scrape Table Tennis (ID: 41)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=41&sportName=Table_Tennis) |
| **Water Polo** | [Scrape Water Polo (ID: 42)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=42&sportName=Water_Polo) |
| **3x3 Basketball** | [Scrape 3x3 Basketball (ID: 190)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=190&sportName=3x3_Basketball) |
| **Counter-Strike 2** | [Scrape Counter-Strike 2 (ID: 75)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=75&sportName=Counter-Strike_2) |
| **Dota 2** | [Scrape Dota 2 (ID: 76)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=76&sportName=Dota_2) |
| **League of legends** | [Scrape League of legends (ID: 77)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=77&sportName=League_of_legends) |
| **Valorant** | [Scrape Valorant (ID: 208)](https://dob-lqpg.onrender.com/api/sport-full-scrape?sportId=208&sportName=Valorant) |

---

## 🛠️ General API Endpoints

### 1. Global Hierarchy
Returns the full tree of Sports > Regions > Competitions.
*   **URL:** [`/api/hierarchy`](https://dob-lqpg.onrender.com/api/hierarchy)

### 2. Bulk Fetch All Sports
Triggers an automated scrape for every single sport in the sportsbook.
*   **URL:** [`/api/fetch-all-sports`](https://dob-lqpg.onrender.com/api/fetch-all-sports)

### 3. View Saved Data (Cached)
Retrieves the most recent data for a specific sport from your MongoDB database.
*   **URL:** `/api/sport-games?sportName={NAME}`
*   **Example:** [Football Latest](https://dob-lqpg.onrender.com/api/sport-games?sportName=Football)

### 4. Real-time Game Count
Returns the current number of upcoming (prematch) games for a sport.
*   **URL:** `/api/sport-games-count?sportName={NAME}`
*   **Example:** [Basketball Count](https://dob-lqpg.onrender.com/api/sport-games-count?sportName=Basketball)

---

## 📁 Storage Info
*   **Database:** MongoDB Atlas
*   **Format:** Optimized JSON objects with nested Markets and Event Odds.
*   **Rule:** Strictly **Prematch Only** (Live games are automatically hidden).
