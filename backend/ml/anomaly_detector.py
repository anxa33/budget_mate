"""
DBSCAN (Density-Based Spatial Clustering of Applications with Noise)
implemented with NumPy only, so no extra dependency (scikit-learn) is needed.

Used by the notifications router to detect unusual spending: transactions
that do not belong to any dense cluster of "normal" spending are labelled
as noise (-1) and reported as anomalies.
"""

from typing import Dict, List, Optional

import numpy as np

NOISE = -1
UNVISITED = -2


def dbscan(points: np.ndarray, eps: float, min_samples: int) -> np.ndarray:
    """
    Cluster `points` (n_samples x n_features).

    Returns an int array of cluster labels, one per point.
    Label -1 means the point is noise (an outlier).
    """
    points = np.asarray(points, dtype=float)
    if points.ndim == 1:
        points = points.reshape(-1, 1)

    n = len(points)
    labels = np.full(n, UNVISITED, dtype=int)
    if n == 0:
        return labels

    # Pairwise euclidean distance matrix (fine for per-user data sizes).
    diff = points[:, None, :] - points[None, :, :]
    dist = np.sqrt((diff ** 2).sum(axis=2))
    neighbours = [np.flatnonzero(dist[i] <= eps) for i in range(n)]

    cluster_id = 0
    for i in range(n):
        if labels[i] != UNVISITED:
            continue

        # Not a core point -> noise for now (may become a border point later).
        if len(neighbours[i]) < min_samples:
            labels[i] = NOISE
            continue

        # Start a new cluster and expand it.
        labels[i] = cluster_id
        queue = list(neighbours[i])
        while queue:
            j = queue.pop()
            if labels[j] == NOISE:
                labels[j] = cluster_id  # border point
            if labels[j] != UNVISITED:
                continue
            labels[j] = cluster_id
            if len(neighbours[j]) >= min_samples:  # j is a core point
                queue.extend(neighbours[j])

        cluster_id += 1

    return labels


def detect_unusual_spending(
    expenses: List[Dict],
    eps: float = 0.5,
    min_samples: int = 3,
    min_category_size: int = 6,
) -> List[Dict]:
    """
    Find unusually HIGH expenses using DBSCAN, category by category.

    Each expense is a dict with at least: id, category, amount.
    The feature is log(1 + amount), so `eps` is a relative distance:
    eps=0.5 means amounts within roughly 1.65x of each other are
    "similar". Expenses that fall outside every dense cluster are noise.

    Only noise points ABOVE the category's normal level are returned
    (an unusually small expense isn't worth alerting about).
    """
    by_category: Dict[str, List[Dict]] = {}
    for e in expenses:
        by_category.setdefault(e["category"], []).append(e)

    anomalies: List[Dict] = []

    for category, items in by_category.items():
        if len(items) < min_category_size:
            continue  # not enough history to know what's "normal"

        amounts = np.array([float(e["amount"]) for e in items])
        features = np.log1p(amounts).reshape(-1, 1)
        labels = dbscan(features, eps=eps, min_samples=min_samples)

        clustered = amounts[labels != NOISE]
        if len(clustered) == 0:
            continue  # no dense cluster at all -> nothing is "normal"

        typical = float(np.median(clustered))
        ceiling = float(clustered.max())

        for item, amount, label in zip(items, amounts, labels):
            if label == NOISE and amount > ceiling:
                anomalies.append({
                    **item,
                    "amount": float(amount),
                    "typical_amount": round(typical, 2),
                    "times_typical": round(float(amount) / typical, 1) if typical > 0 else None,
                })

    return anomalies


#Evaluation
def silhouette_score(points: np.ndarray, labels: np.ndarray) -> Optional[float]:
    """
    Mean silhouette over non-noise points. Range -1..1, higher = tighter,
    better separated clusters. Returns None if fewer than 2 clusters exist
    (silhouette is undefined for a single cluster).
    """
    points = np.asarray(points, dtype=float)
    if points.ndim == 1:
        points = points.reshape(-1, 1)

    mask = labels != NOISE
    pts, lab = points[mask], labels[mask]
    cluster_ids = np.unique(lab)
    if len(cluster_ids) < 2:
        return None

    dist = np.sqrt(((pts[:, None, :] - pts[None, :, :]) ** 2).sum(axis=2))
    scores = []
    for i in range(len(pts)):
        same = lab == lab[i]
        if same.sum() <= 1:
            scores.append(0.0)
            continue
        a = dist[i][same].sum() / (same.sum() - 1)
        b = min(dist[i][lab == c].mean() for c in cluster_ids if c != lab[i])
        scores.append((b - a) / max(a, b) if max(a, b) > 0 else 0.0)
    return float(np.mean(scores))


def classification_metrics(y_true: List[bool], y_pred: List[bool]) -> Dict:
    """Precision / recall / F1 / accuracy where True = 'unusual expense'."""
    yt = np.asarray(y_true, dtype=bool)
    yp = np.asarray(y_pred, dtype=bool)
    tp = int((yt & yp).sum())
    fp = int((~yt & yp).sum())
    fn = int((yt & ~yp).sum())
    tn = int((~yt & ~yp).sum())

    precision = tp / (tp + fp) if (tp + fp) else None
    recall = tp / (tp + fn) if (tp + fn) else None
    f1 = (
        2 * precision * recall / (precision + recall)
        if precision is not None and recall is not None and (precision + recall) > 0
        else None
    )
    r = lambda v: None if v is None else round(v, 4)
    return {
        "true_positives": tp,
        "false_positives": fp,
        "false_negatives": fn,
        "true_negatives": tn,
        "precision": r(precision),
        "recall": r(recall),
        "f1": r(f1),
        "accuracy": round((tp + tn) / len(yt), 4) if len(yt) else None,
    }


def evaluate_clustering_quality(
    expenses: List[Dict],
    eps: float = 0.5,
    min_samples: int = 3,
    min_category_size: int = 6,
) -> Dict:
    """
    Label-free quality report on a user's real expenses, per category.
    """
    by_category: Dict[str, List[Dict]] = {}
    for e in expenses:
        by_category.setdefault(e["category"], []).append(e)

    report = {}
    total_points = total_noise = 0
    for category, items in by_category.items():
        if len(items) < min_category_size:
            report[category] = {"n_expenses": len(items), "note": "Too few expenses to cluster."}
            continue

        feats = np.log1p(np.array([float(e["amount"]) for e in items])).reshape(-1, 1)
        labels = dbscan(feats, eps=eps, min_samples=min_samples)
        n_noise = int((labels == NOISE).sum())
        sil = silhouette_score(feats, labels)

        total_points += len(items)
        total_noise += n_noise
        report[category] = {
            "n_expenses": len(items),
            "n_clusters": int(len(set(labels[labels != NOISE]))),
            "n_noise": n_noise,
            "noise_ratio": round(n_noise / len(items), 4),
            "silhouette": None if sil is None else round(sil, 4),
        }

    return {
        "eps": eps,
        "min_samples": min_samples,
        "overall_noise_ratio": round(total_noise / total_points, 4) if total_points else None,
        "by_category": report,
        "note": (
            "A healthy noise ratio is small (roughly under 10%). "
            "silhouette is None when a category forms only one cluster, "
            "which is normal for consistent spending."
        ),
    }


def _synthetic_expenses(rng: np.random.RandomState, spikes_per_category: int = 2):
    """
    Fake but realistic spending with KNOWN anomalies.
    Normal amounts are log-normal around a category's typical amount;
    spikes are 3x-10x that amount.
    """
    typical = {"Food": 400, "Transport": 150, "Shopping": 2500, "Bills": 1800, "Entertainment": 900}
    expenses, truth = [], []
    next_id = 0
    for category, mu in typical.items():
        for amount in rng.lognormal(np.log(mu), 0.30, size=rng.randint(30, 45)):
            expenses.append({"id": next_id, "category": category, "amount": float(amount)})
            truth.append(False)
            next_id += 1
        for _ in range(spikes_per_category):
            expenses.append({"id": next_id, "category": category, "amount": float(mu * rng.uniform(3, 10))})
            truth.append(True)
            next_id += 1
    return expenses, truth


def evaluate_on_synthetic_data(
    eps: float = 0.5,
    min_samples: int = 3,
    n_trials: int = 20,
    seed: int = 42,
) -> Dict:
    """
    Inject known spikes into synthetic spending, run detect_unusual_spending
    and score how many spikes were caught (recall) and how many alerts were
    correct (precision). Results are pooled over n_trials random datasets.
    """
    rng = np.random.RandomState(seed)
    all_true, all_pred = [], []

    for _ in range(n_trials):
        expenses, truth = _synthetic_expenses(rng)
        flagged_ids = {a["id"] for a in detect_unusual_spending(expenses, eps=eps, min_samples=min_samples)}
        all_true.extend(truth)
        all_pred.extend(e["id"] in flagged_ids for e in expenses)

    return {
        "eps": eps,
        "min_samples": min_samples,
        "n_trials": n_trials,
        "n_expenses_scored": len(all_true),
        **classification_metrics(all_true, all_pred),
    }


def sweep_eps(eps_values=(0.2, 0.3, 0.4, 0.5, 0.7, 1.0), min_samples: int = 3) -> List[Dict]:
    """Compare several eps values on the synthetic benchmark to help tune it."""
    return [evaluate_on_synthetic_data(eps=e, min_samples=min_samples) for e in eps_values]


if __name__ == "__main__":
    import json

    print("Synthetic benchmark (default params):")
    print(json.dumps(evaluate_on_synthetic_data(), indent=2))
    print("\neps sweep (precision / recall / f1):")
    for row in sweep_eps():
        print(f"  eps={row['eps']:<4} P={row['precision']}  R={row['recall']}  F1={row['f1']}")
