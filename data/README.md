# Sahyog Data Directory

This directory is designated for data storage, mocking, testing payloads, and geographical shapefiles required for the Sahyog ecosystem.

## 📁 Directory Purpose

- **Mock Data**: Contains sample JSON datasets for testing SOS alerts, volunteer locations, and resource inventories.
- **Geospatial Assets**: Offline map tiles, GeoJSON boundary files, and terrain information needed for the deployment maps.
- **Database Seeds**: Exported dumps or raw CSV files that can be used to populate the Supabase PostgreSQL database during local development.

## 📊 Database Seeding Workflow

To inject sample data into your local environment:
1. Ensure your backend is configured with the correct `.env` credentials.
2. Run the seeding scripts located in `sahyog/migrations/` or use the dedicated js files (e.g., `seed_full_demo_data.js`).
3. These scripts will automatically utilize the structured payloads stored within this `data` folder to populate zones, missing persons, and mock disaster requests.

## 🗺️ Offline Maps & Shapefiles

For the `sahyog-app` offline maps functionality, ensure that pre-downloaded tile databases (.mbtiles) are placed in the `data/maps` subdirectory before running the app build process.

## ⚠️ Important Note
Do **NOT** commit any files containing sensitive real-world Personally Identifiable Information (PII) or production access tokens into this directory. All mock payloads should strictly use fictional personas.
