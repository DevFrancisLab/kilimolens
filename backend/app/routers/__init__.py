"""FastAPI routers for the Africa's Talking channels and document OCR."""
from app.routers.ocr import router as ocr_router
from app.routers.sms import router as sms_router
from app.routers.ussd import router as ussd_router

__all__ = ["ocr_router", "sms_router", "ussd_router"]
