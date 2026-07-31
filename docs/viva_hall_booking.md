# Seat-Flow Viva Prep: Hall Booking

## 1) Quick MVC Speech

You can say:

`The user starts in the React venue browser, opens a venue, chooses a hall, fills booking details, and confirms the booking. React loads venues from GET /api/v1/venues and halls from GET /api/v1/venues/{venue_id}/halls. When the user confirms, React sends POST /api/v1/hall-bookings. The FastAPI router receives the request, the controller forwards it to the service, and the service checks venue and hall availability, calculates the total price, and saves the booking through the repository. The response goes back to React, which shows the hall booking confirmation screen.`

## 2) Frontend file layout (after split)

The old monolithic `App.tsx` is now modular. `App.tsx` only owns routing/state and API orchestration for hall booking.

| Path | Responsibility |
|------|----------------|
| [App.tsx](../frontend/src/app/App.tsx) | Venue/hall state, `loadHallsForVenue`, `handleHallConfirm` |
| [lib/types.ts](../frontend/src/app/lib/types.ts) | Shared UI types (`Venue`, `Hall`, `HallBooking`, …) |
| [lib/mappers.ts](../frontend/src/app/lib/mappers.ts) | API → UI mapping (`mapApiVenue`, `mapApiHall`, `mapApiHallBooking`) |
| [lib/constants.ts](../frontend/src/app/lib/constants.ts) | Venue types, booking purposes, add-on options |
| [components/views/VenueViews.tsx](../frontend/src/app/components/views/VenueViews.tsx) | Browse, detail, hall form, confirmation views |
| [components/views/DashboardView.tsx](../frontend/src/app/components/views/DashboardView.tsx) | My Bookings (venue tab: edit/cancel hall bookings) |
| [components/modals/EditHallBookingDrawer.tsx](../frontend/src/app/components/modals/EditHallBookingDrawer.tsx) | Edit existing hall booking |
| [components/atoms](../frontend/src/app/components/atoms/index.tsx) | Shared UI atoms (`Badge`, `StarsRow`, …) |

## 3) Clickable Code Map

### Frontend — hall booking views

- [VenueBrowseView](../frontend/src/app/components/views/VenueViews.tsx#L10)
- [VenueDetailView](../frontend/src/app/components/views/VenueViews.tsx#L54)
- [HallBookingView](../frontend/src/app/components/views/VenueViews.tsx#L96)
- [HallConfirmationView](../frontend/src/app/components/views/VenueViews.tsx#L152)
- [DashboardView](../frontend/src/app/components/views/DashboardView.tsx#L14)
- [EditHallBookingDrawer](../frontend/src/app/components/modals/EditHallBookingDrawer.tsx)

### Frontend — App orchestration

- [App](../frontend/src/app/App.tsx#L51)
- [refreshVenues](../frontend/src/app/App.tsx#L90)
- [refreshHallBookings](../frontend/src/app/App.tsx#L103)
- [loadHallsForVenue](../frontend/src/app/App.tsx#L113)
- [requireAuth](../frontend/src/app/App.tsx#L166)
- [handleHallConfirm](../frontend/src/app/App.tsx#L187)

### Frontend — shared helpers

- [mapApiVenue](../frontend/src/app/lib/mappers.ts#L60)
- [mapApiHall](../frontend/src/app/lib/mappers.ts#L77)
- [mapApiHallBooking](../frontend/src/app/lib/mappers.ts#L94)
- [api.createHallBooking](../frontend/src/lib/api.ts#L164)

### Backend

- [venues router](../backend/app/venues/router.py#L1)
- [venues list route](../backend/app/venues/router.py#L25)
- [halls list route](../backend/app/venues/router.py#L35)
- [hall booking create route](../backend/app/venues/router.py#L48)
- [venues controller create_booking](../backend/app/venues/controller.py#L36)
- [venues service create_booking](../backend/app/venues/service.py#L77)
- [venues repository create_booking](../backend/app/venues/repository.py#L88)
- [venues repository get_venue](../backend/app/venues/repository.py#L27)
- [venues repository get_hall](../backend/app/venues/repository.py#L43)

### Schemas and models

- [HallBookingCreate](../backend/app/venues/schemas.py#L46)
- [HallBookingOut](../backend/app/venues/schemas.py#L76)
- [Venue](../backend/app/venues/models.py#L26)
- [Hall](../backend/app/venues/models.py#L57)
- [HallBooking](../backend/app/venues/models.py#L96)

## 4) Question Bank

### React Frontend

1. Which React component contains this feature?

   The feature lives mainly in [VenueBrowseView](../frontend/src/app/components/views/VenueViews.tsx#L10), [VenueDetailView](../frontend/src/app/components/views/VenueViews.tsx#L54), [HallBookingView](../frontend/src/app/components/views/VenueViews.tsx#L96), and [HallConfirmationView](../frontend/src/app/components/views/VenueViews.tsx#L152). Global flow and API orchestration stay in [App](../frontend/src/app/App.tsx#L51).

2. Explain the component hierarchy for this feature.

   `App -> VenueBrowseView -> VenueDetailView -> HallBookingView -> HallConfirmationView`

   Supporting UI: `DashboardView` for managing bookings, `EditHallBookingDrawer` for edits.

3. Which function is executed when the user interacts with this feature?

   The main functions are [loadHallsForVenue](../frontend/src/app/App.tsx#L113), form [validate](../frontend/src/app/components/views/VenueViews.tsx#L106) inside `HallBookingView`, and [handleHallConfirm](../frontend/src/app/App.tsx#L187).

4. Walk me through the frontend flow from the user action until the API request is sent.

   The user selects a venue, [loadHallsForVenue](../frontend/src/app/App.tsx#L113) loads halls, the user selects a hall, fills the form in [HallBookingView](../frontend/src/app/components/views/VenueViews.tsx#L96), and then [handleHallConfirm](../frontend/src/app/App.tsx#L187) sends `api.createHallBooking(...)`.

5. Which React hooks did you use and why?

   `useState` stores selected venue, hall, form values, and loading state. `useEffect` fetches venue and hall booking data in `App`. `useCallback` keeps `refreshVenues`, `refreshHallBookings`, and `loadHallsForVenue` stable.

6. How is state managed for this feature?

   Top-level state lives in `App.tsx`: [selectedVenue](../frontend/src/app/App.tsx#L65), [selectedHall](../frontend/src/app/App.tsx#L66), [venuesLoading](../frontend/src/app/App.tsx#L69), [hallsLoading](../frontend/src/app/App.tsx#L70), [hallBookings](../frontend/src/app/App.tsx#L71), [lastHallBooking](../frontend/src/app/App.tsx#L72), and [hallBookingBusy](../frontend/src/app/App.tsx#L75). Form fields and filters live inside `VenueViews.tsx`.

7. How do you validate user input?

   [HallBookingView](../frontend/src/app/components/views/VenueViews.tsx#L106) validates date, purpose, guest count, and contact details before booking.

8. How do you handle loading states?

   `venuesLoading`, `hallsLoading`, and `hallBookingBusy` in `App` keep the UI honest and prevent double submission.

9. Why was `App.tsx` split into many files?

   The monolith was hard to navigate for viva and maintenance. Hall UI now lives in `VenueViews.tsx`, edit overlay in `EditHallBookingDrawer.tsx`, shared types/mappers under `lib/`, and `App.tsx` keeps only orchestration so each hall-booking step has a clear file.

### Browser DevTools

1. Open Chrome DevTools and show me the Network tab for this feature.

   The main feature request is `POST /api/v1/hall-bookings`, with supporting reads for venues and halls.

2. Trigger the feature and identify the API request in the Network tab.

   The key request is [handleHallConfirm](../frontend/src/app/App.tsx#L187) calling `api.createHallBooking(...)`.

3. Show me the Request URL, HTTP Method, Request Headers, Request Payload, and Response.

   URL: `http://127.0.0.1:8000/api/v1/hall-bookings`
   Method: `POST`
   Headers: `Authorization: Bearer <JWT>`, `Content-Type: application/json`
   Payload: venue id, hall id, booking date, time, duration, purpose, guest count, add-ons, and contact details
   Response: `HallBookingOut`

4. Show me the HTTP Status Code returned by the API.

   `201 Created`

5. Show me how long the request took to complete.

   Use the Network tab Timing section and quote the exact value from the demo.

6. Which request in the Network tab belongs to your feature?

   `POST /api/v1/hall-bookings` (supporting: `GET /api/v1/venues`, `GET /api/v1/venues/{id}/halls`)

### React Developer Tools

1. Open React Developer Tools.

   Open the Components tab and inspect `App` and the current page component (for example `HallBookingView`).

2. Show me the component hierarchy for your feature.

   `App -> VenueBrowseView -> VenueDetailView -> HallBookingView -> HallConfirmationView`

### React Profiler

1. Open the React Profiler.

   Start recording before you navigate through the hall flow.

2. Start recording a profiling session.

   Record while venue loading, hall loading, and booking submission happen.

3. Use your feature and stop the recording.

   Stop after the confirmation screen appears. The important commits are when `selectedVenue`, `selectedHall`, `hallBookingBusy`, and `lastHallBooking` change in `App`.

### Backend MVC

1. Explain the complete request flow from React to the database and back to React.

   React sends the request, the router receives it, the controller forwards it, the service checks the hall and venue, the repository reads/writes the database, and the response returns to React.

2. Which router receives the request?

   [venues router](../backend/app/venues/router.py#L1)

3. Which controller function is executed?

   [venues controller create_booking](../backend/app/venues/controller.py#L36)

4. Which service method is called?

   [venues service create_booking](../backend/app/venues/service.py#L77)

5. Which repository method is called?

   [venues repository create_booking](../backend/app/venues/repository.py#L88)

6. Where is the business logic implemented?

   In [venues service create_booking](../backend/app/venues/service.py#L77), where venue existence, hall availability, and total price are checked.

7. Where is the database access implemented?

   In [venues repository get_venue](../backend/app/venues/repository.py#L27), [venues repository get_hall](../backend/app/venues/repository.py#L43), and [venues repository create_booking](../backend/app/venues/repository.py#L88).

8. Why did you separate the Router, Controller, Service, and Repository layers?

   To keep HTTP handling, business logic, and database operations separated and easier to maintain.

9. Show me the complete backend flow in your code.

   Start with [venues router](../backend/app/venues/router.py#L1), then [venues controller create_booking](../backend/app/venues/controller.py#L36), then [venues service create_booking](../backend/app/venues/service.py#L77), then [venues repository create_booking](../backend/app/venues/repository.py#L88).

### API

1. What is the endpoint for this feature?

   `POST /api/v1/hall-bookings`

2. Why did you choose this HTTP method?

   Because the request creates a new hall booking.

3. What request body does this endpoint accept?

   [HallBookingCreate](../backend/app/venues/schemas.py#L46) accepts venue id, hall id, date, time, duration type, purpose, guest count, add-ons, and contact details.

4. What response does it return?

   [HallBookingOut](../backend/app/venues/schemas.py#L76) returns booking details, venue name, hall name, total, status, and timestamps.

5. Which HTTP status codes can this endpoint return?

   `201`, `401`, `404`, `409`, `422`

### cURL & Postman

1. Copy the cURL command from Chrome DevTools and explain it.

   It is a `POST` request with a JWT and a JSON body describing the hall booking.

2. Execute the same request using Postman.

   Use a `POST` request to `/api/v1/hall-bookings` with Bearer auth.

3. Show me the request body in Postman.

   Include venue id, hall id, booking date, start and end time, duration type, purpose, guest count, add-ons, and contact details.

4. Show me the response returned by the backend.

   The response contains the created hall booking object.

5. Modify one value in the request and execute it again.

   Changing the hall or date may succeed if valid; sending an unavailable hall should fail.

6. What happens if required data is missing?

   FastAPI returns `422 Unprocessable Entity`.

7. What happens if invalid data is sent?

   Invalid schema data returns `422`, and unavailable or mismatched halls return `404` or `409`.

### Database

1. Which database tables are involved?

   `venues`, `halls`, `hall_bookings`, `profiles`

2. Explain the database schema related to your feature.

   `venues` stores the venue, `halls` stores hall details, `hall_bookings` stores the booking record, and `profiles` stores the user.

3. Which model represents this table?

   [Venue](../backend/app/venues/models.py#L26), [Hall](../backend/app/venues/models.py#L57), [HallBooking](../backend/app/venues/models.py#L96), [Profile](../backend/app/users/models.py#L13)

4. What CRUD operation is performed?

   `create` for hall booking, `read` for venues and halls, `update` for booking edits, and `delete` is not used here.

5. How is the data saved to the database?

   The service builds a `HallBooking`, sends it to the repository, and commits the transaction.

6. What happens if the requested record does not exist?

   The service raises `NotFoundError`, which becomes `404 Not Found`.

### Code Understanding

1. Explain this function line by line.

   Use [handleHallConfirm](../frontend/src/app/App.tsx#L187) as the main example.

2. Why did you write this function?

   To convert the hall booking form into one controlled API call and keep the UI state in sync.

3. Explain this API call.

   `api.createHallBooking()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts#L164) wraps `fetch()`, adds headers, parses responses, and throws `ApiError` on failure.

4. Explain this database query.

   The repository methods in [venues/repository.py](../backend/app/venues/repository.py#L18) load venues, halls, and bookings, while the service decides the booking rules.

5. Why did you choose this implementation?

   It keeps the UI straightforward and the hall-booking rules centralized in the backend service. After the frontend split, each hall step maps to a clear file for viva demos.

6. If you had more time, what improvements would you make?

   I would add stricter date/time validation, stronger server-side conflict checks for overlapping hall bookings, and more automated tests.
