"""Quick API QA for RBAC + organizer analytics (demo accounts)."""

from __future__ import annotations

import json
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"
PASS = "password123"


def req(method: str, path: str, token: str | None = None, body: dict | None = None):
    data = None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if body is not None:
        data = json.dumps(body).encode()
    request = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=10) as res:
            raw = res.read().decode() or "null"
            return res.status, json.loads(raw) if raw != "null" else None
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            detail = json.loads(raw)
        except json.JSONDecodeError:
            detail = raw
        return exc.code, detail
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)


def login(email: str):
    status, data = req("POST", "/api/v1/auth/login", body={"email": email, "password": PASS})
    if status != 200 or not isinstance(data, dict):
        return None, status, data
    return data["access_token"], data["user"]["role"], data["user"]["full_name"]


def main() -> int:
    results: list[tuple[str, bool, object, object]] = []

    st, health = req("GET", "/health")
    results.append(("health", st == 200, st, health))

    accounts = [
        ("admin@example.com", "admin"),
        ("rahim.organizer@example.com", "organizer"),
        ("sadia.organizer@example.com", "organizer"),
        ("imran.organizer@example.com", "organizer"),
        ("laila.organizer@example.com", "organizer"),
        ("farhana.customer@example.com", "customer"),
        ("tanvir.customer@example.com", "customer"),
        ("nusrat.customer@example.com", "customer"),
    ]

    tokens: dict[str, tuple[str, str]] = {}
    for email, expected in accounts:
        tok, role_or_st, name = login(email)
        if tok is None:
            results.append((f"login {email}", False, role_or_st, name))
            continue
        ok = role_or_st == expected
        results.append((f"login {email} role={role_or_st}", ok, 200, name))
        tokens[email] = (tok, role_or_st)

    st, data = req("GET", "/api/v1/events")
    count = len(data) if isinstance(data, list) else data
    results.append(("guest GET /events", st == 200 and isinstance(data, list) and len(data) >= 1, st, f"count={count}"))

    st, data = req("GET", "/api/v1/analytics/organizer")
    results.append(("guest analytics (expect 401)", st == 401, st, data))

    st, data = req("GET", "/api/v1/admin/users")
    results.append(("guest admin/users (expect 401)", st == 401, st, data))

    far = tokens.get("farhana.customer@example.com")
    if far:
        tok, _ = far
        st, data = req("GET", "/api/v1/bookings/me", tok)
        count = len(data) if isinstance(data, list) else data
        results.append(("customer bookings/me", st == 200 and isinstance(data, list) and len(data) >= 1, st, f"count={count}"))
        st, data = req("GET", "/api/v1/events/mine", tok)
        results.append(("customer events/mine (expect 403)", st == 403, st, data))
        st, data = req("GET", "/api/v1/analytics/organizer", tok)
        results.append(("customer analytics (expect 403)", st == 403, st, data))
        st, data = req("GET", "/api/v1/admin/users", tok)
        results.append(("customer admin/users (expect 403)", st == 403, st, data))

    org_metrics: dict[str, dict] = {}
    for email in [
        "rahim.organizer@example.com",
        "sadia.organizer@example.com",
        "imran.organizer@example.com",
        "laila.organizer@example.com",
    ]:
        pair = tokens.get(email)
        if not pair:
            continue
        tok, _ = pair
        short = email.split("@")[0]
        st, data = req("GET", "/api/v1/analytics/organizer", tok)
        ok = st == 200 and isinstance(data, dict) and "total_bookings" in data
        if st == 200 and isinstance(data, dict):
            org_metrics[email] = data
            detail = (
                f"bookings={data.get('total_bookings')}, events={data.get('active_events')}, "
                f"seats={data.get('seats_sold')}/{data.get('seats_total')}, "
                f"revenue={data.get('estimated_revenue')}, cancel%={data.get('cancellation_rate')}"
            )
        else:
            detail = data
        results.append((f"org analytics {short}", ok, st, detail))

        st, data = req("GET", "/api/v1/events/mine", tok)
        titles = [e.get("title") for e in data] if isinstance(data, list) else data
        count = len(data) if isinstance(data, list) else data
        results.append((f"org events/mine {short}", st == 200 and isinstance(data, list) and len(data) >= 1, st, f"count={count} titles={titles}"))

        st, data = req("GET", "/api/v1/admin/users", tok)
        results.append((f"org admin blocked {short} (expect 403)", st == 403, st, data))

    rahim = org_metrics.get("rahim.organizer@example.com")
    sadia = org_metrics.get("sadia.organizer@example.com")
    if rahim and sadia:
        distinct = (
            rahim.get("revenue_by_event") != sadia.get("revenue_by_event")
            or rahim.get("total_bookings") != sadia.get("total_bookings")
            or rahim.get("estimated_revenue") != sadia.get("estimated_revenue")
        )
        results.append(
            (
                "analytics isolated rahim vs sadia",
                distinct,
                200,
                f"rahim bookings/rev={rahim.get('total_bookings')}/{rahim.get('estimated_revenue')} "
                f"sadia={sadia.get('total_bookings')}/{sadia.get('estimated_revenue')}",
            )
        )

    adm = tokens.get("admin@example.com")
    if adm:
        tok, _ = adm
        st, data = req("GET", "/api/v1/admin/users", tok)
        count = len(data) if isinstance(data, list) else data
        results.append(("admin users", st == 200 and isinstance(data, list) and len(data) >= 8, st, f"count={count}"))
        st, data = req("GET", "/api/v1/admin/categories", tok)
        count = len(data) if isinstance(data, list) else data
        results.append(("admin categories", st == 200 and isinstance(data, list) and len(data) >= 1, st, f"count={count}"))
        st, data = req("GET", "/api/v1/admin/bookings", tok)
        count = len(data) if isinstance(data, list) else data
        results.append(("admin bookings", st == 200 and isinstance(data, list) and len(data) >= 1, st, f"count={count}"))
        st, data = req("GET", "/api/v1/admin/events", tok)
        count = len(data) if isinstance(data, list) else data
        results.append(("admin events", st == 200 and isinstance(data, list) and len(data) >= 1, st, f"count={count}"))
        st, data = req("GET", "/api/v1/analytics/organizer", tok)
        detail = data.get("total_bookings") if isinstance(data, dict) else data
        results.append(("admin can use organizer analytics", st == 200, st, f"bookings={detail}"))

    print("=== QA RESULTS ===")
    passed = failed = 0
    for name, ok, status, detail in results:
        mark = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        else:
            failed += 1
        print(f"[{mark}] {name} | status={status} | {detail}")
    print(f"=== SUMMARY: {passed} passed, {failed} failed, {passed + failed} total ===")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
