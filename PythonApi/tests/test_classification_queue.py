"""Tests unitaires de la file d'attente de reconnaissance d'image."""
from __future__ import annotations

import threading
import time

import pytest

from app.classification_queue import (
    ClassificationQueue,
    Job,
    MAX_WORKERS,
    get_queue,
    reset_queue_for_tests,
)


@pytest.fixture(autouse=True)
def _reset_singleton():
    reset_queue_for_tests()
    yield
    reset_queue_for_tests()


def _wait_until(predicate, timeout=2.0, step=0.01):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if predicate():
            return True
        time.sleep(step)
    return False


def test_submit_returns_job_with_unique_id():
    q = ClassificationQueue(max_workers=2)
    j1 = q.submit(lambda: 1)
    j2 = q.submit(lambda: 2)
    assert j1.id != j2.id
    assert isinstance(j1, Job)


def test_job_completes_with_result():
    q = ClassificationQueue(max_workers=2)
    job = q.submit(lambda: {"hello": "world"})

    assert _wait_until(lambda: q.get(job.id)[0].status == "done")

    final, info = q.get(job.id)
    assert final.status == "done"
    assert final.result == {"hello": "world"}
    assert info["position"] == 0  # plus en file
    assert info["max_workers"] == 2


def test_job_error_is_captured():
    q = ClassificationQueue(max_workers=1)

    def boom():
        raise RuntimeError("kaboom")

    job = q.submit(boom)
    assert _wait_until(lambda: q.get(job.id)[0].status == "error")

    final, _ = q.get(job.id)
    assert final.status == "error"
    assert final.error == "kaboom"
    assert final.result is None


def test_max_workers_is_enforced():
    """
    Avec 2 workers et 4 jobs longs, à un instant donné on ne doit jamais voir
    plus de 2 jobs "processing" simultanément.
    """
    q = ClassificationQueue(max_workers=2)
    gate = threading.Event()
    in_flight = []
    in_flight_lock = threading.Lock()
    max_seen = {"value": 0}

    def slow():
        with in_flight_lock:
            in_flight.append(1)
            max_seen["value"] = max(max_seen["value"], len(in_flight))
        gate.wait(timeout=2.0)
        with in_flight_lock:
            in_flight.pop()
        return "ok"

    jobs = [q.submit(slow) for _ in range(4)]

    # Laisse le temps aux 2 premiers de démarrer.
    assert _wait_until(lambda: len(in_flight) == 2, timeout=2.0)
    assert max_seen["value"] == 2  # jamais 3+ simultanés

    # Libère tout le monde et attend la complétion.
    gate.set()
    for j in jobs:
        assert _wait_until(lambda j=j: q.get(j.id)[0].status == "done", timeout=3.0)


def test_position_is_fifo():
    """
    Avec 1 seul worker bloqué, les jobs suivants conservent un ordre FIFO
    cohérent dans la file et leur position diminue à mesure qu'ils avancent.
    """
    q = ClassificationQueue(max_workers=1)
    gate = threading.Event()

    def blocker():
        gate.wait(timeout=2.0)
        return "done"

    blocking = q.submit(blocker)
    # Attend que le bloqueur soit en cours pour que les suivants soient bien queued.
    assert _wait_until(lambda: q.get(blocking.id)[0].status == "processing")

    j1 = q.submit(lambda: 1)
    j2 = q.submit(lambda: 2)
    j3 = q.submit(lambda: 3)

    _, info1 = q.get(j1.id)
    _, info2 = q.get(j2.id)
    _, info3 = q.get(j3.id)

    assert info1["position"] == 1
    assert info2["position"] == 2
    assert info3["position"] == 3
    assert info1["queued_total"] == 3
    assert info1["processing_total"] == 1

    gate.set()
    assert _wait_until(lambda: all(
        q.get(j.id)[0].status == "done" for j in (blocking, j1, j2, j3)
    ), timeout=3.0)


def test_get_unknown_job_returns_none_and_snapshot():
    q = ClassificationQueue(max_workers=4)
    job, info = q.get("inexistant")
    assert job is None
    assert info["position"] == 0
    assert info["max_workers"] == 4


def test_done_job_has_zero_position():
    q = ClassificationQueue(max_workers=1)
    job = q.submit(lambda: "ok")
    assert _wait_until(lambda: q.get(job.id)[0].status == "done")
    _, info = q.get(job.id)
    assert info["position"] == 0


def test_purge_after_ttl(monkeypatch):
    """Un job terminé plus vieux que JOB_TTL_SECONDS est purgé au prochain get()."""
    import app.classification_queue as mod

    monkeypatch.setattr(mod, "JOB_TTL_SECONDS", 0.05)

    q = ClassificationQueue(max_workers=1)
    job = q.submit(lambda: "ok")
    assert _wait_until(lambda: q.get(job.id)[0].status == "done")

    time.sleep(0.1)  # dépasse le TTL
    purged, _ = q.get(job.id)
    assert purged is None


def test_get_queue_returns_singleton():
    a = get_queue()
    b = get_queue()
    assert a is b
    assert a.max_workers == MAX_WORKERS


def test_reset_queue_for_tests_creates_fresh_instance():
    a = get_queue()
    a.submit(lambda: "ok")
    reset_queue_for_tests()
    b = get_queue()
    assert b is not a
    # La nouvelle instance ne connaît pas les jobs de l'ancienne.
    assert len(b._jobs) == 0
