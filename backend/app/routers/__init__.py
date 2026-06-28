"""FastAPI routers for the Africa's Talking channels, document OCR and AI Advisory."""
from app.routers.advisory import router as advisory_router
from app.routers.extraction import router as extraction_router
from app.routers.ocr import router as ocr_router
from app.routers.sms import router as sms_router
from app.routers.ussd import router as ussd_router

__all__ = ["advisory_router", "extraction_router", "ocr_router", "sms_router", "ussd_router"]
