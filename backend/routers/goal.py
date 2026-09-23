from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import date
from dateutil.relativedelta import relativedelta
from psycopg2.extras import RealDictCursor

from database import get_connection, close_connection
from routers.auth import get_current_user
from ml.greedy_optimizer import greedy_expense_reduction
from ml.linear_model import forecast_goal_completion


router = APIRouter()


# =====================================================
# SHARED HELPER: last N months of real income and expense
# history, oldest first, as two aligned lists.
# Used by the Linear Regression completion-date forecast,
# which fits an independent trend on each series.
# =====================================================

def _get_monthly_income_expense_history(cursor, user_id: int, months: int = 6):
    cursor.execute("""
        SELECT
            month,
            COALESCE(SUM(income), 0) AS monthly_income,
            COALESCE(SUM(expenses), 0) AS monthly_expense
        FROM (
            SELECT
                DATE_TRUNC('month', income_date) AS month,
                SUM(amount) AS income,
                0 AS expenses
            FROM income
            WHERE user_id = %s
              AND income_date >= CURRENT_DATE - (INTERVAL '1 month' * %s)
            GROUP BY DATE_TRUNC('month', income_date)

            UNION ALL

            SELECT
                DATE_TRUNC('month', expense_date) AS month,
                0 AS income,
                SUM(amount) AS expenses
            FROM expenses
            WHERE user_id = %s
              AND expense_date >= CURRENT_DATE - (INTERVAL '1 month' * %s)
            GROUP BY DATE_TRUNC('month', expense_date)
        ) AS monthly_data
        GROUP BY month
        ORDER BY month ASC;
    """, (user_id, months, user_id, months))

    rows = cursor.fetchall()

    # rows are RealDictRow -> {"month": ..., "monthly_income": ..., "monthly_expense": ...}
    monthly_income = [float(row["monthly_income"] or 0) for row in rows]
    monthly_expense = [float(row["monthly_expense"] or 0) for row in rows]
    return monthly_income, monthly_expense


# =====================================================
# GOAL INPUT MODEL
# =====================================================

class GoalRequest(BaseModel):
    goal_name: str
    target_amount: float
    target_date: str
    current_savings: float = 0


# =====================================================
# GOAL OPTIMIZER
# =====================================================

@router.post("/optimize-goal")
def optimize_goal(goal: GoalRequest, current_user: dict = Depends(get_current_user)):

    if goal.target_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Target amount must be greater than 0"
        )

    if goal.current_savings < 0:
        raise HTTPException(
            status_code=400,
            detail="Current savings cannot be negative"
        )

    try:
        target_date = date.fromisoformat(goal.target_date)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid target date"
        )

    today = date.today()

    if target_date <= today:
        raise HTTPException(
            status_code=400,
            detail="Target date must be in the future"
        )

    # =================================================
    # CALCULATE MONTHS REMAINING
    # =================================================

    months_remaining = (
        (target_date.year - today.year) * 12
        + target_date.month - today.month
    )

    # If target date is later in the month,
    # count the current period appropriately
    if target_date.day > today.day:
        months_remaining += 1

    months_remaining = max(months_remaining, 1)


    # =================================================
    # REMAINING AMOUNT
    # =================================================

    remaining_amount = (
        goal.target_amount - goal.current_savings
    )

    # Goal already achieved
    if remaining_amount <= 0:

        return {
            "goal_name": goal.goal_name,
            "target_amount": goal.target_amount,
            "current_savings": goal.current_savings,
            "remaining_amount": 0,
            "target_date": goal.target_date,
            "months_remaining": months_remaining,
            "required_monthly_saving": 0,
            "average_monthly_income": 0,
            "average_monthly_expense": 0,
            "current_monthly_saving": 0,
            "additional_monthly_saving": 0,
            "feasibility": "Achieved",
            "message": "Congratulations! You have already reached your goal.",
            "recommendations": [],
            "ml_forecast": forecast_goal_completion(
                monthly_income=[],
                monthly_expense=[],
                current_savings=goal.current_savings,
                target_amount=goal.target_amount,
                target_date=goal.target_date,
            ),
        }


    # =================================================
    # DATABASE
    # =================================================

    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:

        # ---------------------------------------------
        # Average monthly income
        # ---------------------------------------------

        cursor.execute("""
            SELECT
                COALESCE(AVG(monthly_income), 0) AS average_income
            FROM (
                SELECT
                    DATE_TRUNC('month', income_date) AS month,
                    SUM(amount) AS monthly_income
                FROM income
                WHERE user_id = %s
                  AND income_date >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', income_date)
            ) AS income_data
        """, (current_user["user_id"],))

        income_result = cursor.fetchone()

        average_income = float(
            income_result["average_income"] or 0
        )


        # ---------------------------------------------
        # Average monthly expenses
        # ---------------------------------------------

        cursor.execute("""
            SELECT
                COALESCE(AVG(monthly_expense), 0) AS average_expense
            FROM (
                SELECT
                    DATE_TRUNC('month', expense_date) AS month,
                    SUM(amount) AS monthly_expense
                FROM expenses
                WHERE user_id = %s
                  AND expense_date >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', expense_date)
            ) AS expense_data
        """, (current_user["user_id"],))

        expense_result = cursor.fetchone()

        average_expense = float(
            expense_result["average_expense"] or 0
        )


        # ---------------------------------------------
        # Current average monthly saving
        # ---------------------------------------------

        current_monthly_saving = (
            average_income - average_expense
        )

        current_monthly_saving = max(
            current_monthly_saving,
            0
        )


        # =================================================
        # REQUIRED MONTHLY SAVING
        # =================================================

        required_monthly_saving = (
            remaining_amount / months_remaining
        )

        required_monthly_saving = round(
            required_monthly_saving,
            2
        )


        # =================================================
        # ADDITIONAL SAVING REQUIRED
        # =================================================

        additional_saving = (
            required_monthly_saving
            - current_monthly_saving
        )

        additional_saving = max(
            additional_saving,
            0
        )

        additional_saving = round(
            additional_saving,
            2
        )


        # =================================================
        # EXPENSE CATEGORY ANALYSIS
        # =================================================

        cursor.execute("""
            SELECT
                category,
                SUM(amount) AS total
            FROM expenses
            WHERE user_id = %s
              AND expense_date >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY category
            ORDER BY total DESC
        """, (current_user["user_id"],))

        categories = cursor.fetchall()


        # =================================================
        # GENERATE RECOMMENDATIONS (Greedy Optimizer)
        # See ml/greedy_optimizer.py
        # =================================================

        recommendations = greedy_expense_reduction(
            categories=[dict(c) for c in categories],
            additional_saving_needed=additional_saving,
        )


        # =================================================
        # LINEAR REGRESSION COMPLETION-DATE FORECAST
        # See ml/linear_model.py - fits an independent trend
        # on income and on expense, rather than on their
        # difference, for a more accurate projection.
        # =================================================

        monthly_income_history, monthly_expense_history = _get_monthly_income_expense_history(
            cursor, current_user["user_id"], months=6
        )

        ml_forecast = forecast_goal_completion(
            monthly_income=monthly_income_history,
            monthly_expense=monthly_expense_history,
            current_savings=goal.current_savings,
            target_amount=goal.target_amount,
            target_date=goal.target_date,
        )


        # =================================================
        # FEASIBILITY
        # =================================================

        if current_monthly_saving >= required_monthly_saving:

            feasibility = "Achievable"

            message = (
                "Your current saving pattern is sufficient "
                "to reach this goal."
            )

        elif (
            additional_saving
            <= current_monthly_saving * 0.30
        ):

            feasibility = "Challenging"

            message = (
                "Your goal is achievable with some "
                "expense reduction."
            )

        else:

            feasibility = "Difficult"

            message = (
                "You may need significant expense reduction "
                "or additional income to reach this goal."
            )


        # =================================================
        # RETURN RESULT
        # =================================================

        return {

            "goal_name": goal.goal_name,

            "target_amount": round(
                goal.target_amount,
                2
            ),

            "current_savings": round(
                goal.current_savings,
                2
            ),

            "remaining_amount": round(
                remaining_amount,
                2
            ),

            "target_date": goal.target_date,

            "months_remaining": months_remaining,

            "required_monthly_saving": required_monthly_saving,

            "average_monthly_income": round(
                average_income,
                2
            ),

            "average_monthly_expense": round(
                average_expense,
                2
            ),

            "current_monthly_saving": round(
                current_monthly_saving,
                2
            ),

            "additional_monthly_saving": additional_saving,

            "feasibility": feasibility,

            "message": message,

            "recommendations": recommendations,

            "ml_forecast": ml_forecast
        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Goal optimizer error: {str(e)}"
        )

    finally:

        close_connection(conn, cursor)

@router.get("/goals-recommendations")
def get_goals_recommendations(current_user: dict = Depends(get_current_user)):

    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute("""
            SELECT
                id,
                goal_name,
                target_amount,
                current_savings,
                deadline,
                status
            FROM savings_goals
            WHERE user_id = %s
            ORDER BY id DESC
        """, (current_user["user_id"],))

        rows = cursor.fetchall()

        monthly_income_history, monthly_expense_history = _get_monthly_income_expense_history(
            cursor, current_user["user_id"], months=6
        )

        recommendations = []

        for row in rows:
            target_amount = float(row["target_amount"] or 0)
            current_savings = float(row["current_savings"] or 0)
            deadline = str(row["deadline"]) if row["deadline"] else None

            progress_percentage = 0.0
            if target_amount > 0:
                progress_percentage = round(
                    min(max((current_savings / target_amount) * 100, 0), 100),
                    1
                )

            ml_forecast = forecast_goal_completion(
                monthly_income=monthly_income_history,
                monthly_expense=monthly_expense_history,
                current_savings=current_savings,
                target_amount=target_amount,
                target_date=deadline or date.today().isoformat(),
            )

            recommendations.append({
                "goal_id": row["id"],
                "goal_name": row["goal_name"],
                "target_amount": target_amount,
                "current_savings": current_savings,
                "deadline": deadline,
                "status": row["status"],
                "progress_percentage": progress_percentage,
                "ml_forecast": ml_forecast,
            })

        return recommendations

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to build goal recommendations: {str(e)}"
        )

    finally:
        close_connection(conn, cursor)

class SaveGoalRequest(BaseModel):
    goal_name: str
    target_amount: float
    current_savings: float = 0.0
    target_date: str
@router.post("/save-goal")
def save_goal(goal: SaveGoalRequest, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    # Determine status based on current savings vs target
    initial_status = "Completed" if goal.current_savings >= goal.target_amount else "In Progress"

    try:
        cursor.execute("""
            INSERT INTO savings_goals (
                user_id,
                goal_name,
                target_amount,
                current_savings,
                deadline,
                status
            ) VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, user_id, goal_name, target_amount, current_savings, deadline, status;
        """, (
            current_user["user_id"],
            goal.goal_name,
            goal.target_amount,
            goal.current_savings,
            goal.target_date,  # Maps directly to 'deadline' column
            initial_status
        ))

        saved_goal = cursor.fetchone()
        conn.commit()

        return {
            "message": "Goal successfully saved to database!",
            "goal": saved_goal
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save goal: {str(e)}"
        )

    finally:
        close_connection(conn, cursor)


@router.get("/goals")
def get_goals(current_user: dict = Depends(get_current_user)):

    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute("""
            SELECT
                id,
                goal_name,
                target_amount,
                current_savings,
                deadline,
                status
            FROM savings_goals
            WHERE user_id = %s
            ORDER BY id DESC
        """, (current_user["user_id"],))

        rows = cursor.fetchall()

        goals = []

        for row in rows:
            target_amount = float(row["target_amount"] or 0)
            current_savings = float(row["current_savings"] or 0)

            progress_percentage = 0.0
            if target_amount > 0:
                progress_percentage = round(
                    min(max((current_savings / target_amount) * 100, 0), 100),
                    1
                )
            # Keep status in sync with actual savings, in case
            # current_savings was updated after the goal was saved
            status = row["status"]
            if current_savings >= target_amount and target_amount > 0:
                status = "Completed"

            goals.append({
                "id": row["id"],
                "goal_name": row["goal_name"],
                "target_amount": target_amount,
                "current_savings": current_savings,
                "deadline": str(row["deadline"]) if row["deadline"] else None,
                "status": status,
                "progress_percentage": progress_percentage
            })

        return goals

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch goals: {str(e)}"
        )

    finally:
        close_connection(conn, cursor)
@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, current_user: dict = Depends(get_current_user)):

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            DELETE FROM savings_goals
            WHERE id = %s
            AND user_id = %s
        """, (goal_id, current_user["user_id"]))

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Goal not found"
            )

        conn.commit()

        return {
            "message": "Goal deleted successfully"
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete goal: {str(e)}"
        )

    finally:
        close_connection(conn, cursor)