# Yntra Plattform - Schema System (Tauri)

Detta dokument beskriver arkitekturen, databasmodellen och det flexibla systemet för schemaläggning och resurshantering över olika yrkesgrupper (skola, personlig assistans, övriga yrken).

## Systemöversikt & Struktur

Eftersom systemet ska stödja flera vitt skilda yrkeskategorier (skola vs personlig assistans), kommer vi bygga applikationen kring en **Modulär Arkitektur**. Admins kan skapa "Arbetsytor" (Workspaces) och aktivera/inaktivera specifika moduler för varje yta.

### Roller & Rättigheter
*   **Superadmin**: Systemägare, kan skapa nya organisationer/skolor och tilldela administratörer.
*   **Admin/Chef**: Hanterar arbetsytan för sin organisation. Kan slå av/på moduler (t.ex. "Elevhantering" vs "Brukare"), lägga in arbetspass, tilldela scheman.
*   **Användare (Lärare/Assistent/Elev)**: Kan se sitt schema, registrera arbetad tid, ansöka om ledighet, osv (beroende på yrke).

### Modulsystemet (Feature Flags)
För att säkerställa att systemet förblir rent för yrken som inte behöver alla funktioner:
*   **Kärnmodul (Alltid på)**: Kalender, Användarprofil, Notifikationer.
*   **Skolmodul (Toggle)**: Lektioner, Betygsystem, Närvaro för klasser, Vikariehantering.
*   **Assistansmodul (Toggle)**: Brukare, Medicinering, Tidsrapportering/Journal, Beredskap/Sovande jour.
*   **Allmän schemamodul (Toggle)**: Skiftbyten, Stämpelklocka, Lön- och Arbetspass-export.

Systemet måste ha en enhetlig Event-modell i botten, med "metadata" (JSON) för yrkesspecifika attribut (t.ex. larm-information för nattpass, eller klassrum för skola).

---

## Plan för Tekniskt Genomförande

### Fas 1: Initiera Tauri och migrera Frontend
- Sätta upp Tauri-appen i mappen med Vite och Vanilla JS/TS (eller valt ramverk).
- Flytta in existerande UI från mappen `ground` in till Tauri web src.
- Få igång det befintliga gränssnittet i Tauri-fönstret.

### Fas 2: Databas & Dataarkitektur
- Implementera lokal SQLite-databas i Tauri (Rust-backend) för lokal utveckling (eller integrera moln-DB/GraphQL).
- Sätta upp scheman: `användare`, `arbetsytor`, `pass/schema`, `relaterade_metadata`.

### Fas 3: Frontend-Logik & Dynamiskt UI
- Skapa Adminpanelen och inställningar.
- Skapa Feature Flag systemet: dölja och visa moduler (som medicinering/vikarie) baserat på `workspace` inställningar.
- Schema Editor: Ett drag-and-drop eller klick-baserat gränssnitt för admins att tilldela tider.

Se `TASKS.md` för uppdelning av exakta arbetsuppgifter.
