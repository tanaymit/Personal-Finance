from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Optional


FIXED_CATEGORIES: list[str] = [
    "Income",
    "Housing & Rent",
    "Debt Payments",
    "Home Maintenance",
    "Utilities & Bills",
    "Groceries",
    "Dining & Coffee",
    "Shopping",
    "Clothing",
    "Transportation",
    "Entertainment",
    "Subscriptions",
    "Health & Medical",
    "Insurance",
    "Fitness & Wellness",
    "Education",
    "Travel",
    "Pets",
    "Cash & ATM",
    "Personal Care",
    "Transfers",
    "Other",
]


# Common merchant/keyword buckets used when the CSV category is too generic (e.g. "Other")
_DINING_KEYWORDS = [
    "subway",
    "wendys",
    "kfc",
    "mcdonald",
    "taco bell",
    "olive garden",
    "chipotle",
    "panera",
    "shake shack",
    "five guys",
    "outback",
    "pf chang",
    "texas roadhouse",
    "red lobster",
    "burger king",
    "chick-fil-a",
    "cheesecake factory",
    "dunkin",
    "starbucks",
    "caribou",
    "blue bottle",
    "peets",
    "doordash",
    "grubhub",
    "postmates",
    "uber eats",
]

_SHOPPING_KEYWORDS = [
    "amazon",
    "apple store",
    "best buy",
    "target",
    "costco",
    "walmart",
    "kohls",
    "homegoods",
    "tj maxx",
    "marshalls",
    "ross",
    "nordstrom",
    "sephora",
    "ulta",
    "adidas",
    "zara",
    "h&m",
    "gap",
    "old navy",
    "uniqlo",
    "macys",
]

_HOME_MAINT_KEYWORDS = [
    "lowes",
    "home depot",
    "ace hardware",
    "ikea",
    "menards",
]

_TRANSPORT_KEYWORDS = [
    "uber",
    "lyft",
    "parkmobile",
    "metro transit",
    "bus fare",
    "train ticket",
    "airport parking",
    "parking",
    "shell",
    "exxon",
    "bp ",
    "chevron",
    "sunoco",
    "mobil ",
    "getgo",
    "speedway",
    "wawa",
]

_SUBSCRIPTION_KEYWORDS = [
    "spotify",
    "hulu",
    "disney",
    "hbo",
    "amazon prime",
    "youtube premium",
    "google fi",
]

_FITNESS_KEYWORDS = [
    "equinox",
    "soulcycle",
    "yoga",
    "fitness",
    "24 hour fitness",
]

_HEALTH_KEYWORDS = [
    "urgent care",
    "doctor",
    "dentist",
    "lab test",
    "physical therapy",
    "copay",
    "vet clinic",
    "pharmacy",
    "cvs",
    "walgreens",
    "rite aid",
]

_INSURANCE_KEYWORDS = [
    "insurance",
    "premium",
    "life insurance",
    "renters insurance",
    "car insurance",
]

_TRAVEL_KEYWORDS = [
    "marriott",
    "southwest",
    "airlines",
    "hotel",
]


def _contains_any(text: str, keywords: list[str]) -> bool:
    t = text.lower()
    return any(k in t for k in keywords)


def map_to_fixed_category(
    *,
    csv_type: str,
    csv_category: str,
    description: str,
) -> str:
    """Map a bank statement row into one of FIXED_CATEGORIES.

    Conventions used by the app:
    - expenses are positive amounts
    - income/refunds are negative amounts

    This function does NOT need amount; it uses csv_type + text.
    """

    c = (csv_category or "").strip()
    t = (csv_type or "").strip().lower()
    d = (description or "").strip()
    dl = d.lower()

    # Deposits
    if t == "deposit":
        if "payroll" in dl or "salary" in dl:
            return "Income"
        return "Transfers"

    # Direct category mappings from the CSV
    direct = {
        "Groceries": "Groceries",
        "Coffee Shops": "Dining & Coffee",
        "Dining Out": "Dining & Coffee",
        "Food Delivery": "Dining & Coffee",
        "Gas/Fuel": "Transportation",
        "Rideshare": "Transportation",
        "Public Transit": "Transportation",
        "Parking": "Transportation",
        "Utilities": "Utilities & Bills",
        "Internet/Phone": "Utilities & Bills",
        "Streaming/Subscriptions": "Subscriptions",
        "Online/Retail Shopping": "Shopping",
        "Clothing": "Clothing",
        "Personal Care": "Personal Care",
        "Pharmacy": "Health & Medical",
        "Healthcare": "Health & Medical",
        "Pet Care": "Pets",
        "Movies/Entertainment": "Entertainment",
        "Education": "Education",
        "Insurance": "Insurance",
        "Travel/Hotel": "Travel",
        "Airfare": "Travel",
        "ATM Withdrawal": "Cash & ATM",
        "Home EMI": "Housing & Rent",
        "Car EMI": "Debt Payments",
        "Personal Loan EMI": "Debt Payments",
        "Home Improvement": "Home Maintenance",
    }

    # Special cases where the CSV category is too broad
    if c in ("EMI/Loans",):
        # EMI/Loans includes both insurance premiums and subscriptions in your file
        if _contains_any(d, _INSURANCE_KEYWORDS):
            return "Insurance"
        if _contains_any(d, _SUBSCRIPTION_KEYWORDS):
            return "Subscriptions"
        return "Debt Payments"

    mapped = direct.get(c)

    # Heuristic refinement (works well for CSV rows labeled "Other")
    if mapped is None or mapped == "Other":
        if _contains_any(d, _DINING_KEYWORDS):
            return "Dining & Coffee"
        if _contains_any(d, _SUBSCRIPTION_KEYWORDS):
            return "Subscriptions"
        if _contains_any(d, _FITNESS_KEYWORDS):
            return "Fitness & Wellness"
        if _contains_any(d, _HEALTH_KEYWORDS):
            return "Health & Medical"
        if _contains_any(d, _INSURANCE_KEYWORDS):
            return "Insurance"
        if _contains_any(d, _TRAVEL_KEYWORDS):
            return "Travel"
        if _contains_any(d, _HOME_MAINT_KEYWORDS):
            return "Home Maintenance"
        if _contains_any(d, _SHOPPING_KEYWORDS):
            return "Shopping"
        if _contains_any(d, _TRANSPORT_KEYWORDS):
            return "Transportation"

    # Personal care bucket (kept separate because it appears a lot)
    if c == "Personal Care" or "barber" in dl or "nail" in dl or "spa" in dl or "hair" in dl:
        return "Personal Care"

    if mapped:
        return mapped

    return "Other"
