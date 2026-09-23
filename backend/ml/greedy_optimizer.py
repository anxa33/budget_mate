
from typing import List, Dict

MAX_REDUCTION_PCT = 0.15  # never suggest cutting more than 15% of a category


def greedy_expense_reduction(
    categories: List[Dict],
    additional_saving_needed: float,
    max_reduction_pct: float = MAX_REDUCTION_PCT,
) -> List[Dict]:

    recommendations: List[Dict] = []

    if additional_saving_needed <= 0 or not categories:
        return recommendations

    remaining_to_reduce = additional_saving_needed

    # Greedy pass: largest category first, take the biggest bite allowed.
    for category in sorted(categories, key=lambda c: c.get("total", 0), reverse=True):
        if remaining_to_reduce <= 0:
            break

        category_name = category.get("category")
        total = float(category.get("total", 0))

        possible_reduction = total * max_reduction_pct
        reduction = min(possible_reduction, remaining_to_reduce)

        if reduction > 0:
            recommendations.append({
                "category": category_name,
                "suggested_reduction": round(reduction, 2),
            })
            remaining_to_reduce -= reduction

    return recommendations
