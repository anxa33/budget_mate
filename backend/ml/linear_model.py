
from datetime import date
from dateutil.relativedelta import relativedelta
from typing import List, Dict, Optional

def fit_linear_regression(x: List[float], y: List[float]) -> Dict[str, float]:
    n = len(x)

    if n == 0:
        return {"slope": 0.0, "intercept": 0.0}

    if n == 1:
        return {"slope": 0.0, "intercept": y[0]}

    mean_x = sum(x) / n
    mean_y = sum(y) / n

    numerator = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
    denominator = sum((x[i] - mean_x) ** 2 for i in range(n))

    if denominator == 0:
        return {"slope": 0.0, "intercept": mean_y}

    slope = numerator / denominator
    intercept = mean_y - slope * mean_x

    return {"slope": slope, "intercept": intercept}


def predict(slope: float, intercept: float, x: float) -> float:
    return slope * x + intercept
#Goal Completion Forecasting

MAX_FORECAST_MONTHS = 120  # cap the search at 10 years so we never loop forever


def forecast_goal_completion(
    monthly_income: List[float],
    monthly_expense: List[float],
    current_savings: float,
    target_amount: float,
    target_date: str,
    today: Optional[date] = None,
) -> Dict:

    today = today or date.today()

    remaining_amount = max(target_amount - current_savings, 0)

    # Goal already reached.
    if remaining_amount <= 0:
        return {
            "method": "linear_regression",
            "predicted_completion_date": today.isoformat(),
            "predicted_completion_label": _format_month_year(today),
            "months_difference": 0,
            "status": "achieved",
            "income_trend_slope": 0.0,
            "expense_trend_slope": 0.0,
            "monthly_trend_slope": 0.0,
            "projected_next_month_saving": 0.0,
            "feasible": True,
            "message": "You've already reached this goal - congratulations!",
        }

    n = min(len(monthly_income), len(monthly_expense))
    income_history = monthly_income[-n:] if n else []
    expense_history = monthly_expense[-n:] if n else []

   
    if n < 2:
        income_now = income_history[0] if n == 1 else 0.0
        expense_now = expense_history[0] if n == 1 else 0.0
        income_regression = {"slope": 0.0, "intercept": income_now}
        expense_regression = {"slope": 0.0, "intercept": expense_now}
    else:
        x_values = list(range(n))
        income_regression = fit_linear_regression(x_values, income_history)
        expense_regression = fit_linear_regression(x_values, expense_history)

    slope_income, intercept_income = income_regression["slope"], income_regression["intercept"]
    slope_expense, intercept_expense = expense_regression["slope"], expense_regression["intercept"]

    def _projected_saving(idx: float) -> float:
    
        projected_income = max(predict(slope_income, intercept_income, idx), 0.0)
        projected_expense = max(predict(slope_expense, intercept_expense, idx), 0.0)
        return projected_income - projected_expense

    cumulative = current_savings
    months_ahead = 0
    reached = False

    for offset in range(1, MAX_FORECAST_MONTHS + 1):
        cumulative += _projected_saving(n - 1 + offset)
        months_ahead = offset

        if cumulative >= target_amount:
            reached = True
            break
    monthly_trend_slope = round(slope_income - slope_expense, 2)
    projected_next_month_saving = round(_projected_saving(n), 2)

    if not reached:
        
        return {
            "method": "linear_regression",
            "predicted_completion_date": None,
            "predicted_completion_label": None,
            "months_difference": None,
            "status": "unreachable",
            "income_trend_slope": round(slope_income, 2),
            "expense_trend_slope": round(slope_expense, 2),
            "monthly_trend_slope": monthly_trend_slope,
            "projected_next_month_saving": projected_next_month_saving,
            "feasible": False,
            "message": (
                "Based on your real income and expense trends, this goal is not "
                "on track to be completed - your projected income isn't outpacing "
                "your projected expenses enough to reach the target. Consider "
                "increasing income or cutting expenses."
            ),
        }

    predicted_date = today + relativedelta(months=months_ahead)
    predicted_label = _format_month_year(predicted_date)

    try:
        target_date_obj = date.fromisoformat(target_date)
    except (ValueError, TypeError):
        target_date_obj = None

    months_difference = None
    status = "on_time"
    timing_phrase = ""

    if target_date_obj:
       
        months_difference = _month_diff(target_date_obj, predicted_date)

        if months_difference > 0:
            status = "late"
            unit = "month" if months_difference == 1 else "months"
            timing_phrase = f" ({months_difference} {unit} late)"
        elif months_difference < 0:
            status = "early"
            early_by = abs(months_difference)
            unit = "month" if early_by == 1 else "months"
            timing_phrase = f" ({early_by} {unit} early)"
        else:
            status = "on_time"
            timing_phrase = " (right on schedule)"

    message = (
        f"Based on your real income and expense trends, you will hit this "
        f"goal by {predicted_label}{timing_phrase}."
    )

    return {
        "method": "linear_regression",
        "predicted_completion_date": predicted_date.isoformat(),
        "predicted_completion_label": predicted_label,
        "months_difference": months_difference,
        "status": status,
        "income_trend_slope": round(slope_income, 2),
        "expense_trend_slope": round(slope_expense, 2),
        "monthly_trend_slope": monthly_trend_slope,
        "projected_next_month_saving": projected_next_month_saving,
        "feasible": True,
        "message": message,
    }


# HELPERS
def _format_month_year(d: date) -> str:
    return d.strftime("%B %Y")
def _month_diff(a: date, b: date) -> int:
    """Number of whole months from a to b (b - a), positive if b is later."""
    return (b.year - a.year) * 12 + (b.month - a.month)
