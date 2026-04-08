from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import List, Optional, Annotated
from datetime import datetime
from bson import ObjectId

# 'str' in API, 'ObjectId' in database
PyObjectId = Annotated[str, BeforeValidator(str)]

class TaskBase(BaseModel):
    taskName: str
    endDate: datetime
    priority: str = "Medium"
    notes: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
class UserBase(BaseModel):
    username: str
class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class User(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    tasks: List[Task] = []
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
class Token(BaseModel):
    token: str
    user: dict
