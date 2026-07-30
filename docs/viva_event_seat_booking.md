# Seat-Flow Viva Prep: Event Seat Booking

## 1) Quick MVC Speech

You can say:

`The user starts in the React frontend, opens an event, selects seats, fills in booking details, and confirms payment. React loads seats from GET /api/v1/events/{event_id}/seats and then submits the booking with POST /api/v1/bookings. FastAPI receives the request in the router, the controller forwards it to the service, and the service checks seat availability, event status, and duplicate booking prevention. The repository layer performs the database access, the transaction is committed in PostgreSQL, and React shows the confirmation screen after the API response returns.`

## 2) Frontend file layout (after split)

The old monolithic `App.tsx` is now modular. `App.tsx` only owns routing/state and API orchestration.

| Path | Responsibility |
|------|----------------|
| [App.tsx](../frontend/src/app/App.tsx) | View state, auth, payment/hall/event handlers |
| [lib/types.ts](../frontend/src/app/lib/types.ts) | Shared UI types (`View`, `Seat`, `SeatFlowEvent`, …) |
| [lib/mappers.ts](../frontend/src/app/lib/mappers.ts) | API → UI mapping (`mapApiEvent`, `mapApiSeat`, …) |
| [lib/constants.ts](../frontend/src/app/lib/constants.ts) | Categories, filters, fallback mock data |
| [lib/utils.ts](../frontend/src/app/lib/utils.ts) | Helpers (`cx`, `statusColor`, …) |
| [lib/animations.tsx](../frontend/src/app/lib/animations.tsx) | Motion presets + `PageTransition` |
| [components/atoms](../frontend/src/app/components/atoms/index.tsx) | Badge, stepper, QR, order summary |
| [components/layout/Header.tsx](../frontend/src/app/components/layout/Header.tsx) | Top navigation |
| [components/modals](../frontend/src/app/components/modals/) | Auth, hold, notifications, edit/delete drawers |
| [components/views](../frontend/src/app/components/views/) | Page views (events, seats, booking, venues, …) |

## 3) Clickable Code Map

### Frontend — booking flow views

- [SeatSelectionView](../frontend/src/app/components/views/SeatSelectionView.tsx#L13)
- [BookingDetailsView](../frontend/src/app/components/views/BookingFlowViews.tsx#L9)
- [PaymentView](../frontend/src/app/components/views/BookingFlowViews.tsx#L33)
- [ConfirmationView](../frontend/src/app/components/views/BookingFlowViews.tsx#L136)
- [EventsView](../frontend/src/app/components/views/EventsView.tsx#L10)
- [EventDetailView](../frontend/src/app/components/views/EventDetailView.tsx#L6)
- [HoldModal](../frontend/src/app/components/modals/HoldModal.tsx#L9)

### Frontend — App orchestration

- [App](../frontend/src/app/App.tsx#L51)
- [refreshEvents](../frontend/src/app/App.tsx#L77)
- [refreshVenues](../frontend/src/app/App.tsx#L90)
- [refreshHallBookings](../frontend/src/app/App.tsx#L103)
- [loadHallsForVenue](../frontend/src/app/App.tsx#L113)
- [requireAuth](../frontend/src/app/App.tsx#L166)
- [handlePayment](../frontend/src/app/App.tsx#L168)

### Frontend — shared helpers

- [mapApiSeat](../frontend/src/app/lib/mappers.ts#L25)
- [mapApiBooking](../frontend/src/app/lib/mappers.ts#L45)
- [api.createBooking](../frontend/src/lib/api.ts#L150)

### Backend

- [bookings router](../backend/app/bookings/router.py#L1)
- [bookings create route](../backend/app/bookings/router.py#L27)
- [bookings controller create](../backend/app/bookings/controller.py#L18)
- [bookings service create](../backend/app/bookings/service.py#L29)
- [bookings repository create](../backend/app/bookings/repository.py#L40)
- [seat list route](../backend/app/seats/router.py#L17)
- [seat list service](../backend/app/seats/service.py#L21)
- [seat list repository](../backend/app/seats/repository.py#L17)
- [events get route](../backend/app/events/router.py#L36)
- [events service get](../backend/app/events/service.py#L36)
- [events repository get](../backend/app/events/repository.py#L44)

### Schemas and models

- [BookingCreate](../backend/app/bookings/schemas.py#L11)
- [BookingOut](../backend/app/bookings/schemas.py#L16)
- [Booking](../backend/app/bookings/models.py#L13)
- [BookingSeat](../backend/app/bookings/models.py#L44)
- [Seat](../backend/app/seats/models.py#L13)
- [Event](../backend/app/events/models.py#L36)
- [Profile](../backend/app/users/models.py#L13)

## 4) Question Bank

### React Frontend

1. Which React component contains this feature?

   The feature lives mainly in [SeatSelectionView](../frontend/src/app/components/views/SeatSelectionView.tsx#L13), [BookingDetailsView](../frontend/src/app/components/views/BookingFlowViews.tsx#L9), [PaymentView](../frontend/src/app/components/views/BookingFlowViews.tsx#L33), and [ConfirmationView](../frontend/src/app/components/views/BookingFlowViews.tsx#L136). Global flow and API orchestration stay in [App](../frontend/src/app/App.tsx#L51).

2. Explain the component hierarchy for this feature.

   `App -> EventsView -> EventDetailView -> SeatSelectionView -> BookingDetailsView -> PaymentView -> ConfirmationView`

   Supporting UI: `HoldModal` during seat hold, atoms like `BookingStepper` / `OrderSummary`.

3. Which function is executed when the user interacts with this feature?

   The main handlers are [toggleSeat](../frontend/src/app/components/views/SeatSelectionView.tsx#L38), [validate](../frontend/src/app/components/views/BookingFlowViews.tsx#L11), [submit](../frontend/src/app/components/views/BookingFlowViews.tsx#L39), and [handlePayment](../frontend/src/app/App.tsx#L168).

4. Walk me through the frontend flow from the user action until the API request is sent.

   The user selects an event, seat data is fetched with `api.listSeats(event.id)` inside `SeatSelectionView`, the user chooses seats, fills booking details, passes validation, and then [handlePayment](../frontend/src/app/App.tsx#L168) sends `api.createBooking(...)`.

5. Which React hooks did you use and why?

   `useState` stores UI and form state, `useEffect` loads seats and events, `useCallback` stabilizes handlers like seat toggles and refresh helpers in `App`, and `useRef` is used for the hold timer in `HoldModal`.

6. How is state managed for this feature?

   Top-level feature state lives in `App.tsx`: `selectedEvent`, `selectedSeats`, `guestName`, `eventsLoading`, and `paying`. Local UI state (search filters, form fields, seat grid) lives inside each view file.

7. How do you validate user input?

   Validation happens in [BookingDetailsView](../frontend/src/app/components/views/BookingFlowViews.tsx#L11) and [PaymentView](../frontend/src/app/components/views/BookingFlowViews.tsx#L39). The frontend blocks empty name/email and incomplete card details.

8. How do you handle loading states?

   `eventsLoading` in `App` handles event fetch status, local `loading` inside `SeatSelectionView` handles seat loading, and `paying` in `App` disables double submission during checkout.

9. Why was `App.tsx` split into many files?

   The monolith was hard to navigate for viva and maintenance. Shared types/mappers/constants moved under `lib/`, page UI under `components/views/`, overlays under `components/modals/`, and `App.tsx` kept only orchestration so each booking step has a clear file.

### Browser DevTools

1. Open Chrome DevTools and show me the Network tab for this feature.

   Use the Network tab and trigger booking. The main request is `POST /api/v1/bookings`.

2. Trigger the feature and identify the API request in the Network tab.

   The booking request comes from [handlePayment](../frontend/src/app/App.tsx#L168) and appears as `POST /api/v1/bookings`.

3. Show me the Request URL, HTTP Method, Request Headers, Request Payload, and Response.

   URL: `http://127.0.0.1:8000/api/v1/bookings`
   Method: `POST`
   Headers: `Authorization: Bearer <JWT>`, `Content-Type: application/json`
   Payload: `{"event_id":"...","seat_ids":["..."]}`
   Response: `BookingOut`

4. Show me the HTTP Status Code returned by the API.

   `201 Created`

5. Show me how long the request took to complete.

   Use the Network tab Timing section and quote the exact duration seen during the demo.

6. Which request in the Network tab belongs to your feature?

   The main request is `POST /api/v1/bookings`; the supporting read request is `GET /api/v1/events/{event_id}/seats`.

### React Developer Tools

1. Open React Developer Tools.

   Open the Components tab and inspect `App` and the current page component (for example `SeatSelectionView` or `PaymentView`).

2. Show me the component hierarchy for your feature.

   `App -> EventDetailView -> SeatSelectionView -> BookingDetailsView -> PaymentView -> ConfirmationView`

### React Profiler

1. Open the React Profiler.

   Start a recording before you click through the booking flow.

2. Start recording a profiling session.

   Record while you select seats, continue, and pay.

3. Use your feature and stop the recording.

   Stop after the confirmation view appears. The meaningful commits are when `selectedSeats`, `paying`, and `view` change in `App`.

### Backend MVC

1. Explain the complete request flow from React to the database and back to React.

   React calls the API, the router receives the request, the controller forwards it to the service, the service checks business rules and availability, the repository performs database access, and the response returns to React.

2. Which router receives the request?

   [bookings router](../backend/app/bookings/router.py#L1)

3. Which controller function is executed?

   [bookings controller create](../backend/app/bookings/controller.py#L18)

4. Which service method is called?

   [bookings service create](../backend/app/bookings/service.py#L29)

5. Which repository method is called?

   [bookings repository create](../backend/app/bookings/repository.py#L40)

6. Where is the business logic implemented?

   In [bookings service create](../backend/app/bookings/service.py#L29), especially seat validation, event validation, and conflict handling.

7. Where is the database access implemented?

   In [bookings repository create](../backend/app/bookings/repository.py#L40), [events repository get](../backend/app/events/repository.py#L44), and [seat list repository](../backend/app/seats/repository.py#L17).

8. Why did you separate the Router, Controller, Service, and Repository layers?

   To keep HTTP, business logic, and database access separate and easier to test.

9. Show me the complete backend flow in your code.

   Start with [bookings router](../backend/app/bookings/router.py#L1), then [bookings controller create](../backend/app/bookings/controller.py#L18), then [bookings service create](../backend/app/bookings/service.py#L29), then [bookings repository create](../backend/app/bookings/repository.py#L40).

### API

1. What is the endpoint for this feature?

   `POST /api/v1/bookings`

2. Why did you choose this HTTP method?

   Because the request creates a new booking record.

3. What request body does this endpoint accept?

   [BookingCreate](../backend/app/bookings/schemas.py#L11) accepts `event_id` and `seat_ids`.

4. What response does it return?

   [BookingOut](../backend/app/bookings/schemas.py#L16) returns booking details, seat numbers, total, status, and timestamps.

5. Which HTTP status codes can this endpoint return?

   `201`, `401`, `404`, `409`, `422`

### cURL & Postman

1. Copy the cURL command from Chrome DevTools and explain it.

   It is a `POST` request with a JWT header and a JSON body containing `event_id` and `seat_ids`.

2. Execute the same request using Postman.

   Use a `POST` request to `/api/v1/bookings` with Bearer auth.

3. Show me the request body in Postman.

   `{"event_id":"...","seat_ids":["..."]}`

4. Show me the response returned by the backend.

   The response contains the new booking object.

5. Modify one value in the request and execute it again.

   If the seat is already booked, the API should return a conflict.

6. What happens if required data is missing?

   FastAPI returns `422 Unprocessable Entity`.

7. What happens if invalid data is sent?

   Schema validation fails with `422`, and business conflicts return `409`.

### Database

1. Which database tables are involved?

   `events`, `seats`, `bookings`, `booking_seats`, `profiles`

2. Explain the database schema related to your feature.

   `events` stores the event, `seats` stores available seats, `bookings` stores the booking header, and `booking_seats` links bookings to seats.

3. Which model represents this table?

   [Event](../backend/app/events/models.py#L36), [Seat](../backend/app/seats/models.py#L13), [Booking](../backend/app/bookings/models.py#L13), [BookingSeat](../backend/app/bookings/models.py#L44), [Profile](../backend/app/users/models.py#L13)

4. What CRUD operation is performed?

   `create` for booking, `read` for events and seats, `update` for seat status.

5. How is the data saved to the database?

   The service creates the booking, inserts `BookingSeat` rows, updates seat status, and commits the transaction.

6. What happens if the requested record does not exist?

   The service raises `NotFoundError`, which becomes `404`.

### Code Understanding

1. Explain this function line by line.

   Use [handlePayment](../frontend/src/app/App.tsx#L168) as the main example.

2. Why did you write this function?

   To convert the user’s payment action into one controlled API request with proper UI feedback.

3. Explain this API call.

   `api.createBooking()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts#L150) wraps `fetch()` and adds headers and error handling.

4. Explain this database query.

   The database work is hidden in the repository methods, especially [bookings repository create](../backend/app/bookings/repository.py#L40) and [seats repository get_many](../backend/app/seats/repository.py#L25).

5. Why did you choose this implementation?

   It is simple to explain, easy to maintain, and protects against double booking. The frontend is modular so each booking step maps to a clear file for viva demos.

6. If you had more time, what improvements would you make?

   I would add stronger server-side locking for concurrent seat holds, more automated tests for the booking path, and optionally React Router instead of the current `view` state machine in `App`.
