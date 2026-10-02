from datetime import date, timedelta

from database import close_connection, get_connection
from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg2.extras import RealDictCursor

from ml.anomaly_detector import detect_unusual_spending
from routers.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

HISTORY_MONTHS = 6  # how much history DBSCAN learns "normal" spending from


@router.get("/unusual-spending")
def unusual_spending_alerts(
    days: int = Query(default=30, ge=1, le=180, description="Only alert on expenses from the last N days"),
    eps: float = Query(default=0.5, gt=0, le=3),
    min_samples: int = Query(default=3, ge=2, le=20),
    current_user: dict = Depends(get_current_user),
):
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute(
            """
            SELECT id, amount, category, expense_date, note
            FROM expenses
            WHERE user_id = %s
              AND expense_date >= CURRENT_DATE - (%s || ' months')::interval
            ORDER BY expense_date DESC, id DESC
            """,
            (current_user["user_id"], HISTORY_MONTHS),
        )
        rows = cursor.fetchall()

        expenses = [
            {
                "id": r["id"],
                "amount": float(r["amount"]),
                "category": r["category"] or "Uncategorized",
                "expense_date": r["expense_date"],
                "note": r["note"] or "",
            }
            for r in rows
        ]

        anomalies = detect_unusual_spending(expenses, eps=eps, min_samples=min_samples)

        cutoff = date.today() - timedelta(days=days)
        alerts = []
        for a in anomalies:
            if a["expense_date"] < cutoff:
                continue

            ratio = a["times_typical"] or 0
            severity = "high" if ratio >= 3 else "medium"
            alerts.append({
                "id": a["id"],
                "category": a["category"],
                "amount": a["amount"],
                "expense_date": str(a["expense_date"]),
                "note": a["note"],
                "typical_amount": a["typical_amount"],
                "times_typical": a["times_typical"],
                "severity": severity,
                "message": (
                    f"Unusual {a['category']} expense of NPR {a['amount']:,.0f} "
                    f"(typically around NPR {a['typical_amount']:,.0f})"
                ),
            })

        alerts.sort(key=lambda x: (x["expense_date"], x["amount"]), reverse=True)

        return {
            "algorithm": "DBSCAN",
            "params": {"eps": eps, "min_samples": min_samples, "days": days},
            "count": len(alerts),
            "alerts": alerts,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to detect unusual spending: {str(e)}")

    finally:
        close_connection(conn, cursor)
