from database import close_connection, get_connection
from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extras import RealDictCursor
from .auth import get_current_user  
router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.get("")
def get_recent_expenses(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]

    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute(
            """
            SELECT id, category, note, expense_date, amount
            FROM expenses
            WHERE user_id = %s
            ORDER BY expense_date DESC, id DESC
            """,
            (user_id,),
        )

        rows = cursor.fetchall()

        expenses = []
        for row in rows:
            expenses.append({
                "id": row["id"],
                "category": row["category"],
                "note": row["note"],
                "expense_date": str(row["expense_date"]),
                "amount": float(row["amount"])
            })

        return expenses

    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Failed to fetch expenses from database"
        )

    finally:
        close_connection(conn, cursor)