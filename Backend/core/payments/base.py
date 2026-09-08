from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Literal


@dataclass
class PaymentInitiationResult:
    """
    What a gateway hands back after we ask it to start a checkout.
    Two shapes, since eSewa and Khalti behave differently:
      - Khalti: a ready-made checkout_url, browser just redirects (GET).
      - eSewa: no URL — the browser must POST a signed HTML form directly
        to esewa_form_url with these exact fields.
    The frontend branches on `method`: GET -> window.location = checkout_url;
    POST -> render a hidden form with `fields` and auto-submit it to
    `checkout_url`.
    """
    checkout_url: str
    method: Literal["GET", "POST"]
    fields: dict[str, str] = field(default_factory=dict)
    gateway_reference: str | None = None  # e.g. Khalti's pidx, captured at initiate time


@dataclass
class PaymentVerificationResult:
    success: bool
    gateway_reference: str | None
    raw_response: dict


class PaymentGatewayClient(ABC):
    """
    One interface, two implementations. Nothing outside core/payments/
    should ever know whether it's talking to eSewa or Khalti — the RSVP
    route just calls these two methods by gateway name.
    """

    @abstractmethod
    async def initiate_payment(
        self, *, merchant_transaction_id: str, amount: Decimal, event_title: str
    ) -> PaymentInitiationResult:
        ...

    @abstractmethod
    async def verify_payment(
        self, *, merchant_transaction_id: str, amount: Decimal, gateway_reference: str | None
    ) -> PaymentVerificationResult:
        ...