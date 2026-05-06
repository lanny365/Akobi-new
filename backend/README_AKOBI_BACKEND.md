# AKOBI Laravel Backend

This backend is the first Laravel API foundation for the existing React hospital app.

## Current scope

- Sanctum token auth
- Departments
- Users with hospital roles
- Patients and patient cards
- Visits and vital-sign queue
- Pharmacy inventory
- Lab test catalog
- Theatre cases

## Demo login

- Email: `admin@akobi.test`
- Password: `password`

## Main endpoints

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/departments`
- `GET /api/patients`
- `POST /api/patients`
- `GET /api/patients/{id}`
- `GET /api/visits`
- `POST /api/visits`
- `GET /api/queue/vital-signs`
- `GET /api/pharmacy/items`
- `GET /api/laboratory/tests`
- `GET /api/theatre/cases`

## Setup

1. Ensure `database/database.sqlite` exists.
2. Run `php artisan key:generate`
3. Run `php artisan migrate:fresh --seed`
4. Run `php artisan serve --host=127.0.0.1 --port=8001`

## Local URLs

- Backend root: `http://127.0.0.1:8001/`
- API health: `http://127.0.0.1:8001/api/health`
- Frontend dev server: `http://localhost:5173`

## Frontend migration notes

Map these current React contexts to the API:

- `CashierContext` -> billing/payments endpoints next
- `PatientQueueContext` and `VitalSignsContext` -> `visits` + `vital_signs`
- `PharmacyInventoryContext` -> `pharmacy_items`
- `DrugRequestContext` -> `drug_requests`
- `TheatreContext` -> `theatre_cases`

The next sensible slice is billing/cashier plus doctor consultation records.
