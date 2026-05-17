# AKOBI Laravel Backend

This backend is the first Laravel API foundation for the existing React hospital app.

## Current scope

- Sanctum token auth
- Departments
- Staff directory / doctors list
- Users with hospital roles
- Patients and patient cards
- Visits and vital-sign queue
- Doctor routing queue
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
- `GET /api/users?role=doctor`
- `GET /api/patients`
- `POST /api/patients`
- `GET /api/patients/{id}`
- `GET /api/visits`
- `POST /api/visits`
- `PATCH /api/visits/{id}/status`
- `PUT /api/visits/{id}/vital-signs`
- `PUT /api/visits/{id}/route-to-doctor`
- `GET /api/queue/vital-signs`
- `GET /api/queue/doctors`
- `GET /api/pharmacy/items`
- `GET /api/laboratory/tests`
- `GET /api/theatre/cases`

## Setup

1. Create a MySQL database in phpMyAdmin named `akobi_hospital`.
2. In `backend/.env`, set:
   - `DB_CONNECTION=mysql`
   - `DB_HOST=127.0.0.1`
   - `DB_PORT=3306`
   - `DB_DATABASE=akobi_hospital`
   - `DB_USERNAME=root`
   - `DB_PASSWORD=` (or your local password)
3. Run `php artisan key:generate`
4. Run `php artisan migrate:fresh --seed`
5. Run `php artisan serve --host=127.0.0.1 --port=8001`

## Local URLs

- Backend root: `http://127.0.0.1:8001/`
- API health: `http://127.0.0.1:8001/api/health`
- Frontend dev server: `http://localhost:5173`
- phpMyAdmin: usually `http://localhost/phpmyadmin`

## Frontend migration notes

Map these current React contexts to the API:

- `CashierContext` -> billing/payments endpoints next
- `PatientQueueContext` and `VitalSignsContext` -> `visits` + `vital_signs` + doctor queue
- `PharmacyInventoryContext` -> `pharmacy_items`
- `DrugRequestContext` -> `drug_requests`
- `TheatreContext` -> `theatre_cases`

The next sensible slice is billing/cashier plus doctor consultation records.
