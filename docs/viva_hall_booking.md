# Seat-Flow Viva Prep: Hall Booking

## 1) Quick MVC Speech

You can say:

`The user starts in the React venue browser, opens a venue, chooses a hall, fills booking details, and confirms the booking. React loads venues from GET /api/v1/venues and halls from GET /api/v1/venues/{venue_id}/halls. When the user confirms, React sends POST /api/v1/hall-bookings. The FastAPI router receives the request, the controller forwards it to the service, and the service checks venue and hall availability, calculates the total price, and saves the booking through the repository. The response goes back to React, which shows the hall booking confirmation screen.`

## 2) Clickable Code Map

### Frontend

- [VenueBrowseView](../frontend/src/app/App.tsx#L1026)
- [VenueDetailView](../frontend/src/app/App.tsx#L1070)
- [HallBookingView](../frontend/src/app/App.tsx#L1112)
- [HallConfirmationView](../frontend/src/app/App.tsx#L1168)
- [refreshVenues](../frontend/src/app/App.tsx#L1888)
- [refreshHallBookings](../frontend/src/app/App.tsx#L1901)
- [loadHallsForVenue](../frontend/src/app/App.tsx#L1911)
- [requireAuth](../frontend/src/app/App.tsx#L1964)
- [handleHallConfirm](../frontend/src/app/App.tsx#L1985)

### Backend

- [venues router](../backend/app/venues/router.py#L1)
- [venues list route](../backend/app/venues/router.py#L25)
- [halls list route](../backend/app/venues/router.py#L35)
- [hall booking create route](../backend/app/venues/router.py#L48)
- [venues controller create_booking](../backend/app/venues/controller.py#L36)
- [venues service create_booking](../backend/app/venues/service.py#L53)
- [venues repository create_booking](../backend/app/venues/repository.py#L72)
- [venues repository get_venue](../backend/app/venues/repository.py#L26)
- [venues repository get_hall](../backend/app/venues/repository.py#L40)

### Schemas and models

- [HallBookingCreate](../backend/app/venues/schemas.py#L46)
- [HallBookingOut](../backend/app/venues/schemas.py#L76)
- [Venue](../backend/app/venues/models.py#L26)
- [Hall](../backend/app/venues/models.py#L57)
- [HallBooking](../backend/app/venues/models.py#L96)

## 3) Question Bank

### React Frontend

1. Which React component contains this feature?

   The feature lives mainly in [VenueBrowseView](../frontend/src/app/App.tsx#L1026), [VenueDetailView](../frontend/src/app/App.tsx#L1070), [HallBookingView](../frontend/src/app/App.tsx#L1112), and [HallConfirmationView](../frontend/src/app/App.tsx#L1168).

2. Explain the component hierarchy for this feature.

   `App -> VenueBrowseView -> VenueDetailView -> HallBookingView -> HallConfirmationView`

3. Which function is executed when the user interacts with this feature?

   The main functions are [loadHallsForVenue](../frontend/src/app/App.tsx#L1911) and [handleHallConfirm](../frontend/src/app/App.tsx#L1985).

4. Walk me through the frontend flow from the user action until the API request is sent.

   The user selects a venue, halls are loaded, the user selects a hall, fills the form in [HallBookingView](../frontend/src/app/App.tsx#L1112), and then [handleHallConfirm](../frontend/src/app/App.tsx#L1985) sends the booking payload.

5. Which React hooks did you use and why?

   `useState` stores selected venue, hall, form values, and loading state. `useEffect` fetches venue and hall data. `useCallback` keeps fetch handlers stable.

6. How is state managed for this feature?

   `App.tsx` stores `[selectedVenue](../frontend/src/app/App.tsx#L1863)`, `[selectedHall](../frontend/src/app/App.tsx#L1864)`, `[venuesLoading](../frontend/src/app/App.tsx#L1867)`, `[hallsLoading](../frontend/src/app/App.tsx#L1868)`, `[hallBookings](../frontend/src/app/App.tsx#L1869)`, `[lastHallBooking](../frontend/src/app/App.tsx#L1870)`, and `[hallBookingBusy](../frontend/src/app/App.tsx#L1873)`.

7. How do you validate user input?

   [HallBookingView](../frontend/src/app/App.tsx#L1112) validates date, purpose, guest count, and contact details before booking.

8. How do you handle loading states?

   `venuesLoading`, `hallsLoading`, and `hallBookingBusy` keep the UI honest and prevent double submission.

### Browser DevTools

1. Open Chrome DevTools and show me the Network tab for this feature.

   The main feature request is `POST /api/v1/hall-bookings`, with supporting reads for venues and halls.

2. Trigger the feature and identify the API request in the Network tab.

   The key request is [handleHallConfirm](../frontend/src/app/App.tsx#L1985) calling `api.createHallBooking(...)`.

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

   `POST /api/v1/hall-bookings`

### React Developer Tools

1. Open React Developer Tools.

   Open the Components tab and inspect the current page component.

2. Show me the component hierarchy for your feature.

   `App -> VenueBrowseView -> VenueDetailView -> HallBookingView -> HallConfirmationView`

### React Profiler

1. Open the React Profiler.

   Start recording before you navigate through the hall flow.

2. Start recording a profiling session.

   Record while venue loading, hall loading, and booking submission happen.

3. Use your feature and stop the recording.

   Stop after the confirmation screen appears. The important commits are when `selectedVenue`, `selectedHall`, `hallBookingBusy`, and `lastHallBooking` change.

### Backend MVC

1. Explain the complete request flow from React to the database and back to React.

   React sends the request, the router receives it, the controller forwards it, the service checks the hall and venue, the repository reads/writes the database, and the response returns to React.

2. Which router receives the request?

   [venues router](../backend/app/venues/router.py#L1)

3. Which controller function is executed?

   [venues controller create_booking](../backend/app/venues/controller.py#L36)

4. Which service method is called?

   [venues service create_booking](../backend/app/venues/service.py#L53)

5. Which repository method is called?

   [venues repository create_booking](../backend/app/venues/repository.py#L72)

6. Where is the business logic implemented?

   In [venues service create_booking](../backend/app/venues/service.py#L53), where venue existence, hall availability, and total price are checked.

7. Where is the database access implemented?

   In [venues repository get_venue](../backend/app/venues/repository.py#L26), [venues repository get_hall](../backend/app/venues/repository.py#L40), and [venues repository create_booking](../backend/app/venues/repository.py#L72).

8. Why did you separate the Router, Controller, Service, and Repository layers?

   To keep HTTP handling, business logic, and database operations separated and easier to maintain.

9. Show me the complete backend flow in your code.

   Start with [venues router](../backend/app/venues/router.py#L1), then [venues controller create_booking](../backend/app/venues/controller.py#L36), then [venues service create_booking](../backend/app/venues/service.py#L53), then [venues repository create_booking](../backend/app/venues/repository.py#L72).

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

   Use [handleHallConfirm](../frontend/src/app/App.tsx#L1985) as the main example.

2. Why did you write this function?

   To convert the hall booking form into one controlled API call and keep the UI state in sync.

3. Explain this API call.

   `api.createHallBooking()` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts#L164) wraps `fetch()`, adds headers, parses responses, and throws `ApiError` on failure.

4. Explain this database query.

   The repository methods in [venues/repository.py](../backend/app/venues/repository.py#L17) load venues, halls, and bookings, while the service decides the booking rules.

5. Why did you choose this implementation?

   It keeps the UI straightforward and the hall-booking rules centralized in the backend service.

6. If you had more time, what improvements would you make?

   I would add stricter date/time validation, server-side conflict checks for overlapping hall bookings, and more automated tests.

