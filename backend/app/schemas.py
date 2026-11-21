"""Request and response models for the NeuralScope API."""
from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field, model_validator

Point = List[float]


class TrainConfig(BaseModel):
    layers: int = Field(2, ge=1, le=8)
    width: int = Field(8, ge=1, le=256)
    act: Literal["tanh", "relu", "sigmoid"] = "tanh"
    opt: Literal["sgd", "momentum", "adam"] = "adam"
    loss: Literal["bce", "mse"] = "bce"
    lr: float = Field(0.02, gt=0, le=10)
    batch: int = Field(16, ge=1, le=100000)  # >= number of training points means full batch
    l2: float = Field(0.0, ge=0, le=10)
    epochs: int = Field(200, ge=1, le=2000)
    seed: int = 7


class TrainRequest(BaseModel):
    cfg: TrainConfig
    Xtr: List[Point]
    Ytr: List[int]
    Xva: List[Point]
    Yva: List[int]
    grid: int = Field(48, ge=8, le=128)  # resolution of the returned decision map
    lim: float = Field(1.6, gt=0, le=10)  # map covers [-lim, lim] on both axes

    @model_validator(mode="after")
    def _check(self) -> "TrainRequest":
        if len(self.Xtr) != len(self.Ytr) or len(self.Xva) != len(self.Yva):
            raise ValueError("X and Y lengths differ")
        if not self.Xtr:
            raise ValueError("training set is empty")
        for p in self.Xtr + self.Xva:
            if len(p) != 2:
                raise ValueError("every point must have exactly 2 features")
        return self


class TrainResponse(BaseModel):
    tl: List[float]
    vl: List[float]
    ta: List[float]
    va: List[float]
    g: List[float]
    params: int
    ms: float
    device: str
    torch: str
    map: List[float]  # grid*grid network outputs, row-major, top row first


class MLRequest(BaseModel):
    Xtr: List[Point]
    Ytr: List[int]
    Xva: List[Point]
    Yva: List[int]
    k: int = Field(5, ge=1, le=200)  # knn neighbours or kmeans clusters
    depth: int = Field(3, ge=1, le=30)
    seed: int = 7


class MLResponse(BaseModel):
    train_acc: Optional[float] = None
    val_acc: Optional[float] = None
    inertia: Optional[float] = None
    iterations: Optional[int] = None
    centers: Optional[List[Point]] = None
    nodes: Optional[int] = None
    depth: Optional[int] = None
    version: str
