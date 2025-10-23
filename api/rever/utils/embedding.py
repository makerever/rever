import logging
import os
from functools import lru_cache

import torch
from django.conf import settings
from sentence_transformers import SentenceTransformer

log = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    # Safe defaults from Django settings OR env OR fallback
    model_name = (
        getattr(settings, "EMBED_MODEL", None) or os.getenv("EMBED_MODEL") or "all-MiniLM-L6-v2"
    ).strip()

    device_pref = (
        (getattr(settings, "EMBED_DEVICE", None) or os.getenv("EMBED_DEVICE") or "")
        .lower()
        .strip()
    )

    # Honor explicit preference only if available; else auto-detect
    if device_pref == "cpu":
        device = "cpu"
    elif device_pref == "mps" and torch.backends.mps.is_available():
        device = "mps"
    elif device_pref == "cuda" and torch.cuda.is_available():
        device = "cuda"
    else:
        device = (
            "mps"
            if torch.backends.mps.is_available()
            else ("cuda" if torch.cuda.is_available() else "cpu")
        )

    log.info("Loading SentenceTransformer '%s' on device=%s", model_name, device)
    return SentenceTransformer(model_name, device=device)


class _LazyModelProxy:
    def __getattr__(self, attr):
        return getattr(get_model(), attr)


model = _LazyModelProxy()
