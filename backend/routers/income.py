from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
import psycopg2
from psycopg2.extras import RealDictCursor  
from database import get_connection, close_connection
from routers.auth import get_current_user


router = APIRouter()

class Income(BaseModel):
    amount: float
    source: str
    payment_method: str
    income_date: str
    note: str = ""

@router.post("/add-income")
def add_income(income: Income, current_user: dict = Depends(get_current_user)):

    if income.amount < 0:
        raise HTTPException(
            status_code=400,
            detail="Amount cannot be negative"
        )

    conn = get_connection()
    cursor = conn.cursor()

    try:

        sql = """
        INSERT INTO income
        (user_id, amount, source, payment_method, income_date, note)
        VALUES (%s, %s, %s, %s, %s, %s)
        """

        cursor.execute(
            sql,
            (
                current_user["user_id"],
                income.amount,
                income.source,
                income.payment_method,
                income.income_date,
                income.note
            )
        )

        conn.commit()

        return {
            "message": "Income added successfully"
        }

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    finally:
        close_connection(conn, cursor)


@router.get("/income")
def get_income(
    limit: Optional[int] = Query(default=None, ge=1, le=1000),
    current_user: dict = Depends(get_current_user)
):

    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:

        query = """
            SELECT
                id,
                income_date,
                source,
                note,
                amount,
                payment_method
            FROM income
            WHERE user_id = %s
            ORDER BY income_date DESC, id DESC
        """

        params = [current_user["user_id"]]

        if limit:
            query += " LIMIT %s"
            params.append(limit)

        cursor.execute(query, tuple(params))

        data = cursor.fetchall()

        return data

    finally:
        close_connection(conn, cursor)


@router.get("/income/{income_id}")
def get_single_income(income_id: int, current_user: dict = Depends(get_current_user)):

    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:

        cursor.execute("""
            SELECT
                id,
                income_date,
                source,
                note,
                amount,
                payment_method
            FROM income
            WHERE id = %s
            AND user_id = %s
        """, (income_id, current_user["user_id"]))

        income = cursor.fetchone()

        if not income:

            raise HTTPException(
                status_code=404,
                detail="Income not found"
            )

        return income

    finally:
        close_connection(conn, cursor)

class IncomeUpdate(BaseModel):
    amount: float
    source: str
    payment_method: str
    income_date: str
    note: str = ""


@router.put("/income/{income_id}")
def update_income(
    income_id: int,
    income: IncomeUpdate,
    current_user: dict = Depends(get_current_user)
):

    if income.amount < 0:
        raise HTTPException(
            status_code=400,
            detail="Amount cannot be negative"
        )

    conn = get_connection()
    cursor = conn.cursor()

    try:

        sql = """
        UPDATE income
        SET
            amount = %s,
            source = %s,
            payment_method = %s,
            income_date = %s,
            note = %s
        WHERE id = %s
        AND user_id = %s
        """

        cursor.execute(
            sql,
            (
                income.amount,
                income.source,
                income.payment_method,
                income.income_date,
                income.note,
                income_id,
                current_user["user_id"]
            )
        )

        if cursor.rowcount == 0:

            raise HTTPException(
                status_code=404,
                detail="Income not found"
            )

        conn.commit()

        return {
            "message": "Income updated successfully"
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
@router.get("/income-summary")
def income_summary(current_user: dict = Depends(get_current_user)):

    user_id = current_user["user_id"]

    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM income
            WHERE user_id = %s
        """, (user_id,))
        total_income = float(cursor.fetchone()["total"] or 0)

        # stat cards
        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM income
            WHERE user_id = %s
              AND DATE_TRUNC(\'month\', income_date) = DATE_TRUNC(\'month\', CURRENT_DATE)
        """, (user_id,))
        this_month_income = float(cursor.fetchone()["total"] or 0)

        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM income
            WHERE user_id = %s
              AND DATE_TRUNC(\'month\', income_date) = DATE_TRUNC(\'month\', CURRENT_DATE - INTERVAL \'1 month\')
        """, (user_id,))
        last_month_income = float(cursor.fetchone()["total"] or 0)

        def pct_change(current, previous):
            if previous > 0:
                return round(((current - previous) / previous) * 100, 1)
            return 100.0 if current > 0 else 0.0

        # Average monthly income (last 6 months)
        cursor.execute("""
            SELECT COALESCE(AVG(monthly_total), 0) AS avg_income
            FROM (
                SELECT
                    DATE_TRUNC(\'month\', income_date) AS month,
                    SUM(amount) AS monthly_total
                FROM income
                WHERE user_id = %s
                  AND income_date >= CURRENT_DATE - INTERVAL \'6 months\'
                GROUP BY DATE_TRUNC(\'month\', income_date)
            ) AS monthly_data
        """, (user_id,))
        avg_monthly_income = float(cursor.fetchone()["avg_income"] or 0)


        #pie/donut chart + highest source
  
        cursor.execute("""
            SELECT
                source,
                COALESCE(SUM(amount), 0) AS total
            FROM income
            WHERE user_id = %s
            GROUP BY source
            ORDER BY total DESC
        """, (user_id,))
        source_rows = cursor.fetchall()

        by_source = []
        for row in source_rows:
            amount = float(row["total"] or 0)
            pct = round((amount / total_income) * 100, 1) if total_income > 0 else 0
            by_source.append({
                "source": row["source"],
                "amount": amount,
                "percentage": pct
            })

        highest_source = by_source[0] if by_source else None

        # Monthly trend (last 6 months, for bar chart)
        
        cursor.execute("""
            SELECT
                TO_CHAR(month, \'Mon\') AS month_label,
                monthly_total
            FROM (
                SELECT
                    DATE_TRUNC(\'month\', income_date) AS month,
                    SUM(amount) AS monthly_total
                FROM income
                WHERE user_id = %s
                  AND income_date >= CURRENT_DATE - INTERVAL \'6 months\'
                GROUP BY DATE_TRUNC(\'month\', income_date)
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
            "total_income": round(total_income, 2),
            "this_month_income": round(this_month_income, 2),
            "this_month_change_pct": pct_change(this_month_income, last_month_income),
            "avg_monthly_income": round(avg_monthly_income, 2),
            "highest_source": highest_source,
            "by_source": by_source,
            "monthly_trend": monthly_trend
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compute income summary: {str(e)}"
        )

    finally:
        close_connection(conn, cursor)

@router.delete("/income/{income_id}")
def delete_income(income_id: int, current_user: dict = Depends(get_current_user)):

    conn = get_connection()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            DELETE FROM income
            WHERE id = %s
            AND user_id = %s
        """, (income_id, current_user["user_id"]))

        if cursor.rowcount == 0:

            raise HTTPException(
                status_code=404,
                detail="Income not found"
            )

        conn.commit()

        return {
            "message": "Income deleted successfully"
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