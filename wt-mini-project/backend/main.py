from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
from typing import List
from bson import ObjectId
import models
import auth
from database import users_collection
from datetime import datetime

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/users/register", response_model=models.Token)
async def register(user_in: models.UserCreate):
    existing_user = await users_collection.find_one({"username": user_in.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_dict = user_in.model_dump()
    user_dict["password"] = auth.get_password_hash(user_dict["password"])
    user_dict["tasks"] = []
    user_dict["updatedAt"] = datetime.utcnow()
    
    result = await users_collection.insert_one(user_dict)
    user_id = str(result.inserted_id)
    
    access_token = auth.create_access_token(
        data={"id": user_id}, expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"token": access_token, "user": {"id": user_id, "username": user_in.username}}

@app.post("/api/users/login", response_model=models.Token)
async def login(user_in: models.UserLogin):
    user = await users_collection.find_one({"username": user_in.username})
    if not user or not auth.verify_password(user_in.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid username or password")
    
    user_id = str(user["_id"])
    access_token = auth.create_access_token(
        data={"id": user_id}, expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"token": access_token, "user": {"id": user_id, "username": user["username"]}}

@app.get("/api/users/tasks", response_model=List[models.Task])
async def get_tasks(current_user: dict = Depends(auth.get_current_user)):
    # Convert MongoDB tasks to models.Task list (handling ObjectId)
    tasks = current_user.get("tasks", [])
    for task in tasks:
        if "_id" not in task:
            task["_id"] = ObjectId()
    return tasks

@app.post("/api/users/tasks", response_model=List[models.Task])
async def add_task(task_in: models.TaskCreate, current_user: dict = Depends(auth.get_current_user)):
    new_task = task_in.model_dump()
    new_task["_id"] = ObjectId()
    new_task["createdAt"] = datetime.utcnow()
    
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$push": {"tasks": new_task}, "$set": {"updatedAt": datetime.utcnow()}}
    )
    
    updated_user = await users_collection.find_one({"_id": current_user["_id"]})
    return updated_user["tasks"]

@app.put("/api/users/tasks/{task_id}", response_model=List[models.Task])
async def update_task(task_id: str, task_in: models.TaskCreate, current_user: dict = Depends(auth.get_current_user)):
    # Find and update the specific task in the tasks array
    result = await users_collection.update_one(
        {"_id": current_user["_id"], "tasks._id": ObjectId(task_id)},
        {"$set": {
            "tasks.$.taskName": task_in.taskName,
            "tasks.$.endDate": task_in.endDate,
            "tasks.$.priority": task_in.priority,
            "tasks.$.notes": task_in.notes,
            "updatedAt": datetime.utcnow()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
        
    updated_user = await users_collection.find_one({"_id": current_user["_id"]})
    return updated_user["tasks"]

@app.delete("/api/users/tasks/{task_id}", response_model=List[models.Task])
async def delete_task(task_id: str, current_user: dict = Depends(auth.get_current_user)):
    result = await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$pull": {"tasks": {"_id": ObjectId(task_id)}}, "$set": {"updatedAt": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
        
    updated_user = await users_collection.find_one({"_id": current_user["_id"]})
    return updated_user["tasks"]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
