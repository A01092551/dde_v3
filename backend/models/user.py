from pydantic import BaseModel, EmailStr
from typing import Optional

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

class User(BaseModel):
    id: int
    name: str
    email: str
    password: str
    role: str
    is_active: bool
    created_at: str
