from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor
from database import get_connection, close_connection
from routers.auth import get_current_user


router = APIRouter()


class Expense(BaseModel):
    amount: float
    category: str
    expense_date: str
    payment_method: str
    note: str = ""

@router.post("/add-expense")
def add_expense(expense: Expense, current_user: dict = Depends(get_current_user)):

    if expense.amount < 0:
        raise HTTPException(
            status_code=400,
            detail="Amount cannot be negative"
        )

    conn = get_connection()
    cursor = conn.cursor()

    try:

        sql = """
        INSERT INTO expenses
        (user_id, amount, category, expense_date, payment_method, note)
        VALUES (%s, %s, %s, %s, %s, %s)
        """

        cursor.execute(
            sql,
            (
                current_user["user_id"],
                expense.amount,
                expense.category,
                expense.expense_date,
                expense.payment_method,
                expense.note
            )
        )

        conn.commit()

        return {
            "message": "Expense added successfully"
        }

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    finally:
        close_connection(conn, cursor)

@router.get("/expenses")
def get_expenses(
    limit: Optional[int] = Query(default=None, ge=1, le=1000),
    current_user: dict = Depends(get_current_user)
):

    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:

        query = """
            SELECT
                id,
                amount,
                category,
                expense_date,
                payment_method,
                note
            FROM expenses
            WHERE user_id = %s
            ORDER BY expense_date DESC, id DESC
        """

        params = [current_user["user_id"]]

        if limit:
            query += " LIMIT %s"
            params.append(limit)

        cursor.execute(query, tuple(params))

        data = cursor.fetchall()

        return data

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    finally:
        close_connection(conn, cursor)


@router.get("/expenses/{expense_id}")
def get_single_expense(expense_id: int, current_user: dict = Depends(get_current_user)):

    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:

        cursor.execute("""
            SELECT
                id,
                amount,
                category,
                expense_date,
                payment_method,
                note
            FROM expenses
            WHERE id = %s
            AND user_id = %s
        """, (expense_id, current_user["user_id"]))

        expense = cursor.fetchone()

        if not expense:
            raise HTTPException(
                status_code=404,
                detail="Expense not found"
            )

        return expense

    finally:
        close_connection(conn, cursor)

class ExpenseUpdate(BaseModel):
    amount: float
    category: str
    expense_date: str
    payment_method: str
    note: str = ""


@router.put("/expenses/{expense_id}")
def update_expense(
    expense_id: int,
    expense: ExpenseUpdate,
    current_user: dict = Depends(get_current_user)
):

    if expense.amount < 0:
        raise HTTPException(
            status_code=400,
            detail="Amount cannot be negative"
        )

    conn = get_connection()
    cursor = conn.cursor()

    try:

        sql = """
        UPDATE expenses
        SET
            amount = %s,
            category = %s,
            expense_date = %s,
            payment_method = %s,
            note = %s
        WHERE id = %s
        AND user_id = %s
        """

        cursor.execute(
            sql,
            (
                expense.amount,
                expense.category,
                expense.expense_date,
                expense.payment_method,
                expense.note,
                expense_id,
                current_user["user_id"]
            )
        )

        if cursor.rowcount == 0:

            raise HTTPException(
                status_code=404,
                detail="Expense not found"
            )

        conn.commit()

        return {
            "message": "Expense updated successfully"
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    finally:
        close_connection(conn, cursor)

@router.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, current_user: dict = Depends(get_current_user)):

    conn = get_connection()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            DELETE FROM expenses
            WHERE id = %s
            AND user_id = %s
        """, (expense_id, current_user["user_id"]))

        if cursor.rowcount == 0:

            raise HTTPException(
                status_code=404,
                detail="Expense not found"
            )

        conn.commit()

        return {
            "message": "Expense deleted successfully"
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    finally:
        close_connection(conn, cursor)

@router.get("/expense-chart")
def expense_chart(current_user: dict = Depends(get_current_user)):

    conn = get_connection()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            SELECT
                category,
                SUM(amount) AS total
            FROM expenses
            WHERE user_id = %s
            GROUP BY category
        """, (current_user["user_id"],))

        rows = cursor.fetchall()

        return [
            {
                "name": row[0],
                "value": float(row[1])
            }
            for row in rows
        ]

    finally:
        close_connection(conn, cursor)

@router.get("/monthly-total")
def get_monthly_total(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Sums all expenses where date is in the current month and year
        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE user_id = %s
              AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)
        """, (current_user["user_id"],))
        
        total = cursor.fetchone()[0]
        return {"monthly_total": float(total)}

    finally:
        close_connection(conn, cursor)

@router.get("/expense-summary")
def expense_summary(current_user: dict = Depends(get_current_user)):

    user_id = current_user["user_id"]

    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:

        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE user_id = %s
        """, (user_id,))
        total_expenses = float(cursor.fetchone()["total"] or 0)

        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE user_id = %s
              AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)
        """, (user_id,))
        this_month_expenses = float(cursor.fetchone()["total"] or 0)

        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE user_id = %s
              AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        """, (user_id,))
        last_month_expenses = float(cursor.fetchone()["total"] or 0)

        def pct_change(current, previous):
            if previous > 0:
                return round(((current - previous) / previous) * 100, 1)
            return 100.0 if current > 0 else 0.0

       
        cursor.execute("""
            SELECT COALESCE(AVG(monthly_total), 0) AS avg_expense
            FROM (
                SELECT
                    DATE_TRUNC('month', expense_date) AS month,
                    SUM(amount) AS monthly_total
                FROM expenses
                WHERE user_id = %s
                  AND expense_date >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', expense_date)
            ) AS monthly_data
        """, (user_id,))
        avg_monthly_expense = float(cursor.fetchone()["avg_expense"] or 0)

        # By category breakdown (donut chart + highest category)

        cursor.execute("""
            SELECT
                category,
                COALESCE(SUM(amount), 0) AS total
            FROM expenses
            WHERE user_id = %s
            GROUP BY category
            ORDER BY total DESC
        """, (user_id,))
        category_rows = cursor.fetchall()

        by_category = []
        for row in category_rows:
            amount = float(row["total"] or 0)
            pct = round((amount / total_expenses) * 100, 1) if total_expenses > 0 else 0
            by_category.append({
                "category": row["category"],
                "amount": amount,
                "percentage": pct
            })

        highest_category = by_category[0] if by_category else None

        # Monthly trend (last 6 months, for bar chart)
        cursor.execute("""
            SELECT
                TO_CHAR(month, 'Mon') AS month_label,
                monthly_total
            FROM (
                SELECT
                    DATE_TRUNC('month', expense_date) AS month,
                    SUM(amount) AS monthly_total
                FROM expenses
                WHERE user_id = %s
                  AND expense_date >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', expense_date)
            ) AS monthly_data
            ORDER BY month
        """, (user_id,))
        trend_rows = cursor.fetchall()

        monthly_trend = [
            {
                "month": row["month_label"],
                "value": float(row["monthly_total"] or 0)
            }
            for row in trend_rows
        ]

        return {
            "total_expenses": round(total_expenses, 2),
            "this_month_expenses": round(this_month_expenses, 2),
            "this_month_change_pct": pct_change(this_month_expenses, last_month_expenses),
            "avg_monthly_expense": round(avg_monthly_expense, 2),
            "highest_category": highest_category,
            "by_category": by_category,
            "monthly_trend": monthly_trend
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compute expense summary: {str(e)}"
        )

    finally:
        close_connection(conn, cursor)