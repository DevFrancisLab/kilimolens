"""FastAPI routers for the Africa's Talking USSD and SMS channels."""
from app.routers.sms import router as sms_router
from app.routers.ussd import router as ussd_router

__all__ = ["sms_router", "ussd_router"]
