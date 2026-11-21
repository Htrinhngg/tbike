from fastapi import APIRouter, Depends
from pydantic import AwareDatetime
from psycopg import Connection

from ..db import get_db
from ..rate_limit import rate_limit
from ..schemas import LoaiXe, LookupRequest, LookupResult, PublicVehicle, PublicVehicleModel
from ..services import models as model_svc
from ..services import public as svc

router = APIRouter(prefix="/api/public", tags=["Công khai"])


@router.get("/vehicles", response_model=list[PublicVehicle], summary="Xe và tình trạng trống theo thời gian")
def public_vehicles(tu: AwareDatetime | None = None, den: AwareDatetime | None = None,
                    loai_xe: LoaiXe | None = None, conn: Connection = Depends(get_db)):
    return svc.list_vehicles(conn, tu, den, loai_xe)


@router.get("/vehicle-models", response_model=list[PublicVehicleModel], summary="Mẫu xe và số xe trống theo thời gian")
def public_vehicle_models(tu: AwareDatetime | None = None, den: AwareDatetime | None = None,
                          loai_xe: LoaiXe | None = None, conn: Connection = Depends(get_db)):
    return model_svc.public_models(conn, tu, den, loai_xe)


@router.post("/rental-requests/lookup", response_model=LookupResult,
             summary="Khách tra cứu trạng thái: cần mã yêu cầu + số điện thoại",
             dependencies=[Depends(rate_limit("lookup"))])
def lookup(body: LookupRequest, conn: Connection = Depends(get_db)):
    return svc.lookup(conn, body)
