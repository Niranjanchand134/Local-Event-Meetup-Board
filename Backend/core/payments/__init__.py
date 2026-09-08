from models.enums import PaymentGateway
from core.payments.base import PaymentGatewayClient
from core.payments.esewa import EsewaGateway
from core.payments.khalti import KhaltiGateway

_GATEWAYS: dict[PaymentGateway, PaymentGatewayClient] = {
    PaymentGateway.esewa: EsewaGateway(),
    PaymentGateway.khalti: KhaltiGateway(),
}


def get_gateway(gateway: PaymentGateway) -> PaymentGatewayClient:
    return _GATEWAYS[gateway]