from database import close_connection, get_connection
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

router = APIRouter(prefix="/auth")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "budgetmate-secret-key-change-later"
ALGORITHM = "HS256"

security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication token")

        return {"user_id": user_id, "email": payload.get("email")}

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ---------------- REQUEST MODELS ----------------


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ---------------- REGISTER ----------------


@router.post("/register")
def register(user: RegisterRequest):

    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Check if email already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (user.email,))

        existing_user = cursor.fetchone()

        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Hash password
        hashed_password = pwd_context.hash(user.password)

        # Insert user
        cursor.execute(
            """
            INSERT INTO users (full_name, email, password)
            VALUES (%s, %s, %s)
            RETURNING id
            """,
            (user.name, user.email, hashed_password),
        )

        user_id = cursor.fetchone()[0]

        conn.commit()

        return {"message": "User registered successfully", "user_id": user_id}

    finally:
        close_connection(conn, cursor)


# ---------------- LOGIN ----------------


@router.post("/login")
def login(user: LoginRequest):

    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Find user by email
        cursor.execute(
            """
            SELECT id, full_name, email, password
            FROM users
            WHERE email = %s
            """,
            (user.email,),
        )

        db_user = cursor.fetchone()

        # User doesn't exist
        if not db_user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user_id = db_user[0]
        full_name = db_user[1]
        email = db_user[2]
        hashed_password = db_user[3]

        # Verify password
        if not pwd_context.verify(user.password, hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Create JWT
        token = jwt.encode(
            {"user_id": user_id, "email": email}, SECRET_KEY, algorithm=ALGORITHM
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {"id": user_id, "name": full_name, "email": email},
        }

    finally:
        close_connection(conn, cursor)