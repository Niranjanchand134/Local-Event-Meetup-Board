from decimal import Decimal

import httpx

from config import get_settings
from core.payments.base import PaymentGatewayClient, PaymentInitiationResult, PaymentVerificationResult

settings = get_settings()


class KhaltiGateway(PaymentGatewayClient):
    """
    Khalti's ePayment flow is a real server-to-server call: we POST the
    order details, Khalti responds with a ready checkout URL and a pidx
    (payment index) we store as gateway_reference for later lookup.
    """

    async def initiate_payment(
        self, *, merchant_transaction_id: str, amount: Decimal, event_title: str
    ) -> PaymentInitiationResult:
        amount_paisa = int(amount * 100)  # Khalti expects the smallest currency unit

        payload = {
            "return_url": f"{settings.frontend_base_url}/payments/khalti/callback",
            "website_url": settings.frontend_base_url,
            "amount": amount_paisa,
            "purchase_order_id": merchant_transaction_id,
            "purchase_order_name": event_title[:120],
        }
        headers = {"Authorization": f"Key {settings.khalti_secret_key}"}

        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(settings.khalti_initiate_url, json=payload, headers=headers)

        if response.status_code != 200:
            raise RuntimeError(f"Khalti initiate failed: {response.text}")

        data = response.json()

        return PaymentInitiationResult(
            checkout_url=data["payment_url"],
            method="GET",
            gateway_reference=data["pidx"],
        )

    async def verify_payment(
        self, *, merchant_transaction_id: str, amount: Decimal, gateway_reference: str | None
    ) -> PaymentVerificationResult:
        if not gateway_reference:
            return PaymentVerificationResult(success=False, gateway_reference=None, raw_response={})

        headers = {"Authorization": f"Key {settings.khalti_secret_key}"}
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                settings.khalti_lookup_url, json={"pidx": gateway_reference}, headers=headers
            )

        data = response.json() if response.status_code == 200 else {}
        success = data.get("status") == "Completed"

        return PaymentVerificationResult(
            success=success,
            gateway_reference=gateway_reference,
            raw_response=data,
        )