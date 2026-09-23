from fastapi import APIRouter, Depends
from database import get_connection, close_connection
from routers.auth import get_current_user

router = APIRouter()
@router.get("/monthly-overview")
def monthly_overview(current_user=Depends(get_current_user)):

    user_id = current_user["user_id"]

    conn = get_connection()
    cursor = conn.cursor()

    query = """
        SELECT
            TO_CHAR(month, 'Mon') AS month,
            income,
            expenses,
            income - expenses AS savings
        FROM (
            SELECT
                DATE_TRUNC('month', income_date) AS month,
                SUM(amount) AS income,
                0 AS expenses
            FROM income
            WHERE user_id = %s
            GROUP BY DATE_TRUNC('month', income_date)

            UNION ALL

            SELECT
                DATE_TRUNC('month', expense_date) AS month,
                0 AS income,
                SUM(amount) AS expenses
            FROM expenses
            WHERE user_id = %s
            GROUP BY DATE_TRUNC('month', expense_date)
        ) AS monthly_data

        GROUP BY month, income, expenses
        ORDER BY month;
    """

    cursor.execute(query, (user_id, user_id))

    rows = cursor.fetchall()

    result = []

    for row in rows:
        result.append({
            "month": row[0],
            "income": float(row[1]),
            "expenses": float(row[2]),
            "savings": float(row[3])
        })

    close_connection(conn, cursor)

    return result

@router.get("/dashboard-summary")
def dashboard_summary(current_user=Depends(get_current_user)):

    user_id = current_user["user_id"]

    conn = get_connection()
    cursor = conn.cursor()

    try:

        def scalar(query, params):
            cursor.execute(query, params)
            row = cursor.fetchone()
            return float(row[0]) if row and row[0] is not None else 0.0

        # Totals (all time)
        total_income = scalar(
            "SELECT COALESCE(SUM(amount), 0) FROM income WHERE user_id = %s",
            (user_id,)
        )
        total_expenses = scalar(
            "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = %s",
            (user_id,)
        )
        total_balance = total_income - total_expenses

        # This month
        this_month_income = scalar("""
            SELECT COALESCE(SUM(amount), 0) FROM income
            WHERE user_id = %s
              AND DATE_TRUNC('month', income_date) = DATE_TRUNC('month', CURRENT_DATE)
        """, (user_id,))
        this_month_expenses = scalar("""
            SELECT COALESCE(SUM(amount), 0) FROM expenses
            WHERE user_id = %s
              AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)
        """, (user_id,))
        savings_this_month = this_month_income - this_month_expenses

        # Last month (for % change comparisons)
        last_month_income = scalar("""
            SELECT COALESCE(SUM(amount), 0) FROM income
            WHERE user_id = %s
              AND DATE_TRUNC('month', income_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        """, (user_id,))
        last_month_expenses = scalar("""
            SELECT COALESCE(SUM(amount), 0) FROM expenses
            WHERE user_id = %s
              AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        """, (user_id,))
        savings_last_month = last_month_income - last_month_expenses
        balance_last_month_end = total_balance - savings_this_month

        def pct_change(current, previous):
            if previous not in (0, None) and abs(previous) > 0:
                return round(((current - previous) / abs(previous)) * 100, 1)
            return 100.0 if current > 0 else (0.0 if current == 0 else -100.0)

        return {
            "total_balance": round(total_balance, 2),
            "total_balance_change_pct": pct_change(total_balance, balance_last_month_end),

            "total_income": round(total_income, 2),
            "total_income_change_pct": pct_change(this_month_income, last_month_income),

            "total_expenses": round(total_expenses, 2),
            "total_expenses_change_pct": pct_change(this_month_expenses, last_month_expenses),

            "savings_this_month": round(savings_this_month, 2),
            "savings_change_pct": pct_change(savings_this_month, savings_last_month),
        }

    finally:
        close_connection(conn, cursor)