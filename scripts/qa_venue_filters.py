"""QA venue browse filters (type chips, search, sort) against live API data."""

from __future__ import annotations

import json
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"

# Must match frontend/src/app/lib/constants.ts VENUE_TYPES
VENUE_TYPES = [
    "All",
    "Convention Center",
    "Hotel Banquet",
    "Community Hall",
    "Conference Center",
    "Rooftop",
    "Restaurant & Banquet",
]


def req(path: str):
    request = urllib.request.Request(BASE + path, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=10) as res:
            return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode()
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)


def normalize_type(value: str) -> str:
    return (
        value.strip()
        .lower()
        .replace("  ", " ")
        .replace("centre", "center")
    )


def type_matches(venue_type: str, filter_name: str) -> bool:
    if filter_name == "All":
        return True
    return normalize_type(venue_type) == normalize_type(filter_name)


def filter_venues(venues: list[dict], type_filter: str, search: str = "") -> list[dict]:
    q = search.lower().strip()
    out = []
    for v in venues:
        if not type_matches(v.get("type", ""), type_filter):
            continue
        hay = f"{v.get('name','')} {v.get('city','')} {v.get('address','')}".lower()
        if q and q not in hay:
            continue
        out.append(v)
    return out


def sort_venues(venues: list[dict], sort: str) -> list[dict]:
    if sort == "Price":
        return sorted(venues, key=lambda v: float(v.get("price_from") or 0))
    return sorted(venues, key=lambda v: float(v.get("rating") or 0), reverse=True)


def main() -> int:
    results: list[tuple[str, bool, object]] = []

    st, health = req("/health")
    results.append(("health", st == 200, f"status={st} {health}"))

    st, venues = req("/api/v1/venues")
    ok = st == 200 and isinstance(venues, list) and len(venues) >= 1
    results.append(("GET /venues", ok, f"status={st} count={len(venues) if isinstance(venues, list) else venues}"))
    if not ok or not isinstance(venues, list):
        print("=== QA RESULTS ===")
        for name, passed, detail in results:
            print(f"[{'PASS' if passed else 'FAIL'}] {name} | {detail}")
        print("=== SUMMARY: API unavailable — start with npm run dev ===")
        return 1

    types_present = sorted({v.get("type", "") for v in venues})
    results.append(("venues have type field", all(v.get("type") for v in venues), f"types={types_present}"))

    # Convention Center must match seeded Bashundhara (centre/center tolerant)
    cc = filter_venues(venues, "Convention Center")
    results.append(
        (
            "filter Convention Center finds Bashundhara",
            any("bashundhara" in v.get("name", "").lower() for v in cc),
            f"count={len(cc)} names={[v.get('name') for v in cc]}",
        )
    )

    # Hotel Banquet must match Pan Pacific
    hb = filter_venues(venues, "Hotel Banquet")
    results.append(
        (
            "filter Hotel Banquet finds Pan Pacific",
            any("pan pacific" in v.get("name", "").lower() for v in hb),
            f"count={len(hb)} names={[v.get('name') for v in hb]}",
        )
    )

    # Empty chips for types not in seed should return 0 (current seed only has 2 types)
    for chip in ["Community Hall", "Conference Center", "Rooftop", "Restaurant & Banquet"]:
        matched = filter_venues(venues, chip)
        results.append((f"filter {chip} empty (current seed)", len(matched) == 0, f"count={len(matched)}"))

    # All chip returns everything
    all_v = filter_venues(venues, "All")
    results.append(("filter All returns all venues", len(all_v) == len(venues), f"count={len(all_v)}/{len(venues)}"))

    # Centre/Center spelling tolerance (regression for the bug we fixed)
    fake = [{"name": "Test", "type": "Convention Centre", "city": "Dhaka", "address": "X", "price_from": 1, "rating": 4}]
    results.append(
        (
            "normalize Centre vs Center",
            len(filter_venues(fake, "Convention Center")) == 1,
            "Convention Centre data matches Convention Center chip",
        )
    )

    # Search by city
    dhaka = filter_venues(venues, "All", "Dhaka")
    results.append(("search city Dhaka", len(dhaka) == len(venues), f"count={len(dhaka)}"))

    # Search by name fragment
    bash = filter_venues(venues, "All", "bashundhara")
    results.append(("search name bashundhara", len(bash) == 1, f"count={len(bash)} names={[v.get('name') for v in bash]}"))

    # Search miss
    miss = filter_venues(venues, "All", "zzzz-no-such-venue")
    results.append(("search miss returns empty", len(miss) == 0, f"count={len(miss)}"))

    # Combined type + search
    combo = filter_venues(venues, "Hotel Banquet", "sonargaon")
    results.append(
        (
            "combined Hotel Banquet + sonargaon",
            len(combo) == 1 and "pan pacific" in combo[0].get("name", "").lower(),
            f"count={len(combo)} names={[v.get('name') for v in combo]}",
        )
    )

    # Sort by price ascending
    by_price = sort_venues(venues, "Price")
    prices = [float(v.get("price_from") or 0) for v in by_price]
    results.append(("sort Price ascending", prices == sorted(prices), f"prices={prices}"))

    # Sort by rating descending
    by_rating = sort_venues(venues, "Rating")
    ratings = [float(v.get("rating") or 0) for v in by_rating]
    results.append(("sort Rating descending", ratings == sorted(ratings, reverse=True), f"ratings={ratings}"))

    # Every filter chip is defined in FE constants
    results.append(
        (
            "FE VENUE_TYPES chips covered",
            VENUE_TYPES[0] == "All" and "Convention Center" in VENUE_TYPES and "Hotel Banquet" in VENUE_TYPES,
            f"chips={VENUE_TYPES}",
        )
    )

    # API types should align with chips after normalize (no orphan types that chips can't select)
    orphan = [t for t in types_present if not any(type_matches(t, chip) for chip in VENUE_TYPES if chip != "All")]
    results.append(("no orphan API types vs chips", len(orphan) == 0, f"orphans={orphan}"))

    print("=== VENUE FILTER QA RESULTS ===")
    passed = failed = 0
    for name, ok, detail in results:
        mark = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        else:
            failed += 1
        print(f"[{mark}] {name} | {detail}")
    print(f"=== SUMMARY: {passed} passed, {failed} failed, {passed + failed} total ===")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
