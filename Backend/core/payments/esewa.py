import base64
import hashlib
import hmac
from decimal import Decimal

import httpx

from config import get_settings
from core.payments.base import PaymentGatewayClient, PaymentInitiationResult, PaymentVerificationResult

settings = get_settings()


class EsewaGateway(PaymentGatewayClient):
    """
    eSewa's v2 ePay flow doesn't have a server-side "initiate" API call —
    the merchant signs a set of form fields locally and the user's browser
    POSTs them straight to eSewa's form endpoint. We just build and sign
    those fields here.
    """

    async def initiate_payment(
        self, *, merchant_transaction_id: str, amount: Decimal, event_title: str
    ) -> PaymentInitiationResult:
        amount_str = f"{amount:.2f}"

        fields = {
            "amount": amount_str,
            "tax_amount": "0",
            "total_amount": amount_str,
            "transaction_uuid": merchant_transaction_id,
            "product_code": settings.esewa_merchant_code,
            "product_service_charge": "0",
            "product_delivery_charge": "0",
            "success_url": f"{settings.frontend_base_url}/payments/esewa/callback",
            "failure_url": f"{settings.frontend_base_url}/payments/esewa/callback",
            "signed_field_names": "total_amount,transaction_uuid,product_code",
        }

        signature_string = (
            f"total_amount={fields['total_amount']},"
            f"transaction_uuid={fields['transaction_uuid']},"
            f"product_code={fields['product_code']}"
        )
        signature = hmac.new(
            settings.esewa_secret_key.encode(), signature_string.encode(), hashlib.sha256
        ).digest()
        fields["signature"] = base64.b64encode(signature).decode()

        return PaymentInitiationResult(
            checkout_url=settings.esewa_form_url,
            method="POST",
            fields=fields,
        )

    async def verify_payment(
        self, *, merchant_transaction_id: str, amount: Decimal, gateway_reference: str | None
    ) -> PaymentVerificationResult:
        params = {
            "product_code": settings.esewa_merchant_code,
            "total_amount": f"{amount:.2f}",
            "transaction_uuid": merchant_transaction_id,
        }

        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(settings.esewa_status_url, params=params)

        data = response.json() if response.status_code == 200 else {}
        success = data.get("status") == "COMPLETE"

        return PaymentVerificationResult(
            success=success,
            gateway_reference=data.get("ref_id"),
            raw_response=data,
        )