# SeatFlow Demo Accounts

Seeded local accounts for development and viva demos.  
Password for **all** accounts: `password123`

Re-seed after DB reset:

```bash
cd backend
python -m scripts.seed_data
```

---

## Admin

| Name | Email | Password | Account type |
|---|---|---|---|
| Demo Admin | `admin@example.com` | `password123` | Admin |

---

## Organizers (4)

| Name | Email | Password | Account type | Notes |
|---|---|---|---|---|
| Rahim Uddin Ahmed | `rahim.organizer@example.com` | `password123` | Organizer | Concert events (Artcell, Coke Studio) |
| Sadia Rahman | `sadia.organizer@example.com` | `password123` | Organizer | Conference events (TechSummit, STEM Forum) |
| Imran Chowdhury | `imran.organizer@example.com` | `password123` | Organizer | Theatre events (Nuruldin, Hamlet) |
| Laila Karim | `laila.organizer@example.com` | `password123` | Organizer | Sports events (BPL Watch Party, Marathon Expo) |

---

## Customers (3)

| Name | Email | Password | Account type | Notes |
|---|---|---|---|---|
| Farhana Akter | `farhana.customer@example.com` | `password123` | Customer | Bookings across concert, conference, sports |
| Tanvir Hasan | `tanvir.customer@example.com` | `password123` | Customer | Bookings across conference, concert, theatre |
| Nusrat Jahan | `nusrat.customer@example.com` | `password123` | Customer | Bookings across theatre, sports, concert |

---

## Quick login tips

- Sign in as any **organizer** → open **Organizer Panel → Analytics** to see metrics from that organizer’s real events and bookings.
- Sign in as any **customer** → open **My Bookings** to see their seeded reservations.
- Sign in as **admin** → open **Admin** for users, categories, bookings, and platform events.
