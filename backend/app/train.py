"""Real mini-batch training with PyTorch (the same experiment the browser Training Lab runs in JavaScript)."""
from __future__ import annotations

import time
from typing import List, Tuple

import numpy as np
import torch
from torch import nn

from .schemas import TrainConfig, TrainRequest, TrainResponse

ACTS = {"tanh": nn.Tanh, "relu": nn.ReLU, "sigmoid": nn.Sigmoid}


def pick_device() -> torch.device:
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


def build_model(cfg: TrainConfig) -> nn.Sequential:
    sizes = [2] + [cfg.width] * cfg.layers
    mods: List[nn.Module] = []
    for a, b in zip(sizes[:-1], sizes[1:]):
        mods += [nn.Linear(a, b), ACTS[cfg.act]()]
    mods += [nn.Linear(sizes[-1], 1)]  # the sigmoid is applied inside the loss / at prediction
    return nn.Sequential(*mods)


def make_optimizer(cfg: TrainConfig, params) -> torch.optim.Optimizer:
    if cfg.opt == "adam":
        return torch.optim.Adam(params, lr=cfg.lr)
    if cfg.opt == "momentum":
        return torch.optim.SGD(params, lr=cfg.lr, momentum=0.9)
    return torch.optim.SGD(params, lr=cfg.lr)


def _loss_fn(cfg: TrainConfig, logits: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
    if cfg.loss == "bce":
        return nn.functional.binary_cross_entropy_with_logits(logits, y)
    return nn.functional.mse_loss(torch.sigmoid(logits), y)


def _eval(model: nn.Module, cfg: TrainConfig, X: torch.Tensor, y: torch.Tensor) -> Tuple[float, float]:
    model.eval()
    with torch.no_grad():
        logits = model(X)
        loss = _loss_fn(cfg, logits, y).item()
        acc = ((torch.sigmoid(logits) >= 0.5).float() == y).float().mean().item()
    model.train()
    return loss, acc


def _grad_norm(model: nn.Module, cfg: TrainConfig, X: torch.Tensor, y: torch.Tensor) -> float:
    """Size of the weight gradient measured on the last mini-batch (L2 norm)."""
    total = 0.0
    for p in model.parameters():
        if p.grad is not None:
            total += float(p.grad.detach().pow(2).sum())
    return total ** 0.5


def train(req: TrainRequest) -> TrainResponse:
    cfg = req.cfg
    torch.manual_seed(cfg.seed)
    np.random.seed(cfg.seed)
    dev = pick_device()
    Xtr = torch.tensor(req.Xtr, dtype=torch.float32, device=dev)
    Ytr = torch.tensor(req.Ytr, dtype=torch.float32, device=dev).unsqueeze(1)
    Xva = torch.tensor(req.Xva, dtype=torch.float32, device=dev) if req.Xva else Xtr[:0]
    Yva = torch.tensor(req.Yva, dtype=torch.float32, device=dev).unsqueeze(1) if req.Yva else Ytr[:0]
    model = build_model(cfg).to(dev)
    opt = make_optimizer(cfg, model.parameters())
    n = Xtr.shape[0]
    bs = n if cfg.batch >= n else cfg.batch
    gen = torch.Generator(device="cpu").manual_seed(cfg.seed + 5)
    hist = {k: [] for k in ("tl", "vl", "ta", "va", "g")}
    t0 = time.perf_counter()
    last_g = 0.0
    for _ in range(cfg.epochs):
        perm = torch.randperm(n, generator=gen).to(dev)
        for b in range(0, n, bs):
            idx = perm[b:b + bs]
            opt.zero_grad(set_to_none=True)
            loss = _loss_fn(cfg, model(Xtr[idx]), Ytr[idx])
            if cfg.l2 > 0:  # same convention as the browser lab: penalty on the sum of squared weights
                loss = loss + cfg.l2 * sum((m.weight ** 2).sum() for m in model if isinstance(m, nn.Linear))
            loss.backward()
            last_g = _grad_norm(model, cfg, Xtr, Ytr)
            opt.step()
        tl, ta = _eval(model, cfg, Xtr, Ytr)
        vl, va = _eval(model, cfg, Xva, Yva) if len(Xva) else (float("nan"), float("nan"))
        hist["tl"].append(tl); hist["ta"].append(ta)
        hist["vl"].append(vl if vl == vl else 0.0); hist["va"].append(va if va == va else 0.0)
        hist["g"].append(last_g)
    if dev.type == "cuda":
        torch.cuda.synchronize()
    ms = (time.perf_counter() - t0) * 1000.0

    r, lim = req.grid, req.lim
    xs = (np.arange(r) + 0.5) / r * 2 * lim - lim
    ys = lim - (np.arange(r) + 0.5) / r * 2 * lim
    gx, gy = np.meshgrid(xs, ys)
    pts = torch.tensor(np.stack([gx.ravel(), gy.ravel()], 1), dtype=torch.float32, device=dev)
    model.eval()
    with torch.no_grad():
        out = torch.sigmoid(model(pts)).squeeze(1).cpu().numpy()
    params = sum(p.numel() for p in model.parameters())
    return TrainResponse(params=params, ms=ms, device=str(dev), torch=torch.__version__,
                         map=[float(v) for v in out], **hist)
