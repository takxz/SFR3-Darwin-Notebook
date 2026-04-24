"""
File d'attente pour la reconnaissance d'image.

Limite à MAX_WORKERS jobs concurrents (par défaut 8). Les soumissions au-delà
de cette limite sont mises en file et traitées dès qu'un worker se libère.

Le client suit l'avancement via /classification/status/<job_id>.
"""
from __future__ import annotations

import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from typing import Any, Callable

# Limite explicitée par le besoin produit: 8 agents de reconnaissance simultanés.
MAX_WORKERS = 8

# Durée de rétention d'un job terminé avant purge (laisse le temps au front de
# venir chercher le résultat même en cas de poll lent / coupure réseau brève).
JOB_TTL_SECONDS = 300


@dataclass
class Job:
    id: str
    submitted_at: float
    status: str = "queued"  # queued | processing | done | error
    started_at: float | None = None
    finished_at: float | None = None
    result: Any | None = None
    error: str | None = None


class ClassificationQueue:
    def __init__(self, max_workers: int = MAX_WORKERS) -> None:
        self.max_workers = max_workers
        self._executor = ThreadPoolExecutor(
            max_workers=max_workers, thread_name_prefix="classif"
        )
        self._lock = threading.Lock()
        self._jobs: dict[str, Job] = {}
        # FIFO des ids non-terminés (queued + processing). Permet de calculer la
        # position d'un job en file en O(n) sans tri.
        self._pending_order: list[str] = []

    def submit(self, work: Callable[[], Any]) -> Job:
        job = Job(id=uuid.uuid4().hex, submitted_at=time.time())
        with self._lock:
            self._jobs[job.id] = job
            self._pending_order.append(job.id)
            self._purge_expired_locked()

        def _runner() -> None:
            with self._lock:
                job.status = "processing"
                job.started_at = time.time()
            try:
                result = work()
                with self._lock:
                    job.result = result
                    job.status = "done"
            except Exception as exc:  # noqa: BLE001
                with self._lock:
                    job.error = str(exc)
                    job.status = "error"
            finally:
                with self._lock:
                    job.finished_at = time.time()
                    if job.id in self._pending_order:
                        self._pending_order.remove(job.id)

        self._executor.submit(_runner)
        return job

    def get(self, job_id: str) -> tuple[Job | None, dict[str, int]]:
        """Retourne (job, snapshot) où snapshot décrit l'état de la file."""
        with self._lock:
            self._purge_expired_locked()
            job = self._jobs.get(job_id)
            queued_ids = [
                jid for jid in self._pending_order
                if self._jobs[jid].status == "queued"
            ]
            processing_total = sum(
                1 for j in self._jobs.values() if j.status == "processing"
            )
            position = 0
            if job is not None and job.status == "queued":
                try:
                    position = queued_ids.index(job.id) + 1
                except ValueError:
                    position = 0
            snapshot = {
                "position": position,
                "queued_total": len(queued_ids),
                "processing_total": processing_total,
                "max_workers": self.max_workers,
            }
            return job, snapshot

    def _purge_expired_locked(self) -> None:
        now = time.time()
        expired = [
            jid for jid, j in self._jobs.items()
            if j.finished_at is not None and (now - j.finished_at) > JOB_TTL_SECONDS
        ]
        for jid in expired:
            self._jobs.pop(jid, None)


_queue: ClassificationQueue | None = None
_queue_lock = threading.Lock()


def get_queue() -> ClassificationQueue:
    global _queue
    if _queue is None:
        with _queue_lock:
            if _queue is None:
                _queue = ClassificationQueue()
    return _queue


def reset_queue_for_tests() -> None:
    """Hook réservé aux tests: purge l'instance singleton."""
    global _queue
    with _queue_lock:
        if _queue is not None:
            _queue._executor.shutdown(wait=False, cancel_futures=True)
        _queue = None
