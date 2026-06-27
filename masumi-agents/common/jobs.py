"""Shared MIP-003 job lifecycle manager (used by every agent).

Flow:
  start_job -> create payment (awaiting_payment)
            -> background: wait for payment -> running -> run report
            -> complete payment with result hash -> completed
status returns the job state and, when completed, the structured report.

Keeps a per-job audit trail (Masumi requires auditability).
"""
from __future__ import annotations

import asyncio
import time
import uuid
from typing import Any, Awaitable, Callable, Optional

from common import mip003
from common.payment import PaymentProvider, hash_payload

# A runner takes validated input_data and returns the structured report dict.
Runner = Callable[[dict], Awaitable[dict]] | Callable[[dict], dict]

_POLL_INTERVAL_S = 2.0
_PAYMENT_TIMEOUT_S = 600.0


class Job:
    def __init__(self, job_id: str, identifier_from_purchaser: str, input_data: dict) -> None:
        self.job_id = job_id
        self.identifier_from_purchaser = identifier_from_purchaser
        self.input_data = input_data
        self.status = mip003.STATUS_AWAITING_PAYMENT
        self.blockchain_identifier: str = ""
        self.result: Optional[dict] = None
        self.message: Optional[str] = None
        self.created_at = int(time.time())
        self.audit: list[dict] = []

    def log(self, event: str, **detail: Any) -> None:
        self.audit.append({"event": event, "at": int(time.time()), **detail})


class JobManager:
    def __init__(self, provider: PaymentProvider, runner: Runner) -> None:
        self.provider = provider
        self.runner = runner
        self.jobs: dict[str, Job] = {}

    async def start_job(self, identifier_from_purchaser: str, input_data: dict) -> dict:
        job = Job(uuid.uuid4().hex, identifier_from_purchaser, input_data)
        self.jobs[job.job_id] = job
        job.log("job_created")

        payment = await self.provider.create_payment(identifier_from_purchaser, input_data)
        job.blockchain_identifier = payment["blockchainIdentifier"]
        job.log("payment_requested", blockchainIdentifier=job.blockchain_identifier, mode=self.provider.mode)

        asyncio.create_task(self._await_payment_and_run(job))

        return {
            "job_id": job.job_id,
            "blockchainIdentifier": job.blockchain_identifier,
            "payByTime": payment.get("payByTime"),
            "submitResultTime": payment.get("submitResultTime"),
            "unlockTime": payment.get("unlockTime"),
            "externalDisputeUnlockTime": payment.get("externalDisputeUnlockTime"),
            "identifierFromPurchaser": identifier_from_purchaser,
            "input_hash": hash_payload(input_data),
            "status": job.status,
            "amountLovelace": payment.get("amountLovelace"),
        }

    async def _await_payment_and_run(self, job: Job) -> None:
        deadline = time.time() + _PAYMENT_TIMEOUT_S
        try:
            while time.time() < deadline:
                if await self.provider.is_paid(job.blockchain_identifier):
                    break
                await asyncio.sleep(_POLL_INTERVAL_S)
            else:
                job.status = mip003.STATUS_FAILED
                job.message = "Payment was not received before the deadline."
                job.log("payment_timeout")
                return

            job.log("payment_confirmed")
            job.status = mip003.STATUS_RUNNING
            job.log("execution_started")

            result = self.runner(job.input_data)
            if asyncio.iscoroutine(result):
                result = await result

            job.result = result
            job.status = mip003.STATUS_COMPLETED
            job.log("execution_completed")

            await self.provider.complete(job.blockchain_identifier, hash_payload(result))
            job.log("payment_settled", result_hash=hash_payload(result))
        except Exception as exc:  # pragma: no cover - defensive
            job.status = mip003.STATUS_FAILED
            job.message = f"Execution failed: {exc}"
            job.log("execution_failed", error=str(exc))

    def status(self, job_id: str) -> Optional[Job]:
        return self.jobs.get(job_id)
