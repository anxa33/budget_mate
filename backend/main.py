from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from auth import get_current_user
# from routers.auth import get_current_user
from routers import expenses
from routers import income
from routers import addcsv
from routers import goal
from routers import auth
from routers.auth import get_current_user
from routers import transaction
# from monthlyoverview import monthly_overview
from routers import monthlyoverview

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:5174",

    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(expenses.router)
app.include_router(income.router)
app.include_router(addcsv.router)
app.include_router(goal.router)
app.include_router(auth.router)
app.include_router(transaction.router, prefix="/api")
app.include_router(monthlyoverview.router)

@app.get("/")
def home():
    return {
        "message": "Budget Mate API is running"
    }