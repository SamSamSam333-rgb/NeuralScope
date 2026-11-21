"""scikit-learn reference implementations used to cross-check the browser versions."""
from __future__ import annotations

import numpy as np
import sklearn
from sklearn.cluster import KMeans
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier

from .schemas import MLRequest, MLResponse


def _arr(req: MLRequest):
    return (np.array(req.Xtr, dtype=float), np.array(req.Ytr, dtype=int),
            np.array(req.Xva, dtype=float).reshape(-1, 2), np.array(req.Yva, dtype=int))


def knn(req: MLRequest) -> MLResponse:
    Xtr, ytr, Xva, yva = _arr(req)
    m = KNeighborsClassifier(n_neighbors=min(req.k, len(Xtr))).fit(Xtr, ytr)
    va = float(m.score(Xva, yva)) if len(Xva) else None
    return MLResponse(train_acc=float(m.score(Xtr, ytr)), val_acc=va, version=sklearn.__version__)


def tree(req: MLRequest) -> MLResponse:
    Xtr, ytr, Xva, yva = _arr(req)
    m = DecisionTreeClassifier(max_depth=req.depth, criterion="gini", random_state=req.seed).fit(Xtr, ytr)
    va = float(m.score(Xva, yva)) if len(Xva) else None
    return MLResponse(train_acc=float(m.score(Xtr, ytr)), val_acc=va, nodes=int(m.tree_.node_count),
                      depth=int(m.get_depth()), version=sklearn.__version__)


def kmeans(req: MLRequest) -> MLResponse:
    Xtr, _, _, _ = _arr(req)
    m = KMeans(n_clusters=min(req.k, len(Xtr)), n_init=10, random_state=req.seed).fit(Xtr)
    return MLResponse(inertia=float(m.inertia_), iterations=int(m.n_iter_),
                      centers=[[float(a), float(b)] for a, b in m.cluster_centers_], version=sklearn.__version__)
