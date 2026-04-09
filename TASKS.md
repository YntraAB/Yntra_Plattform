# Trello / Task Tracker - Yntra Plattform

Detta är vår Kanban/Trello-inspirerade tavla för bygget av Yntras webbbaserade schemasystem.

---

## 🏗 Att Göra (To-Do)
*Dessa uppgifter väntar på att bli tilldelade.*

- [ ] Skapa ett dedikerat gränssnitt för att byta mellan organisationens team (För Admins)
- [ ] Implementera 'Brukare/Patient' detaljvy (Journal Dashboard) i Assistansmodulen
- [ ] Koppla Meddelanden (Inbox) med realtids-prenumeration mot Supabase

---

## 🔄 Pågår (In Progress)

- (Inget just nu)

## ✅ Klart (Done)
*Färdiga moduler för översikt.*

- [x] Uppdatera och omarbeta inloggningssidan från "Volt" till "Yntra Plattform".
- [x] Färdigställa roll-baserat auktoriseringssystem (RBAC) frontend <-> backend isolation.
- [x] Lägga in säkerhetsrutiner (RLS-policies på databasnivå och search_paths för RPC-funktioner).
- [x] Skapa funktionen för att bjuda in anställda (Integrerat i Directory och Edge Functions).
- [x] **Bygg Settings UI & Kod-logik (Context & Databas-uppdatering)**
  - **Tilldelad:** AI (Antigravity)
  - **Status:** Klar! `WorkspaceContext.tsx` och `SettingsPage.tsx` är live och integrerade med sidofältet!
- [x] Sätta upp prenumerationer mot Databasklient (Supabase MCP)
- [x] Autentisering och Login via Supabase (`useAuth`)
- [x] Rensa bort Tauri/Desktop-beroenden från projektet.
- [x] Initiera och strukturera upp React/Vite-miljön med Shadcn UI.
- [x] Sätta upp Cloud/API Databas strukturen (Exampelvis via Supabase/PostgreSQL).
- [x] Utforma tabell-scheman för `users`, `events` (pass) och `workspaces` (företag/arbetsytor).

---

### Arbetsrutiner för AI:s och utvecklare: 
1. **Dra en uppgift:** När du börjar arbeta med en uppgift, flytta den från *Att Göra* till *Pågår* och skriv "*Tilldelad: [Ditt Namn/ID]*".
2. **Kommunicera i filen:**  Om du stöter på problem, lägg till noteringar under respektive task.
3. **Avsluta en uppgift:** När en finess är byggd och fungerar, flytta uppgiften till *Klart*.
