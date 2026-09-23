from fastapi import APIRouter, UploadFile, File, HTTPException, Depends

import pandas as pd
import io

from database import get_connection, close_connection
from routers.auth import get_current_user


router = APIRouter()
@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if not file.filename.lower().endswith(".csv"):

        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed"
        )

    contents = await file.read()

    try:

        df = pd.read_csv(
            io.BytesIO(contents)
        )

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=f"Could not read CSV: {str(e)}"
        )
 
    required_columns = [
        "type",
        "amount",
        "description",
        "date",
        "payment_method"
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:

        raise HTTPException(
            status_code=400,
            detail=f"Missing columns: {missing_columns}"
        )

    conn = get_connection()
    cursor = conn.cursor()

    try:

        for _, row in df.iterrows():

            transaction_type = (
                str(row["type"])
                .strip()
                .lower()
            )

            amount = float(row["amount"])

            description = str(
                row["description"]
            )

            date = row["date"]

            payment_method = str(
                row["payment_method"]
            ).strip()

            if transaction_type in [
                "income",
                "deposit"
            ]:

                description_lower = (
                    description.lower()
                )

                if any(
                    word in description_lower
                    for word in [
                        "salary",
                        "payroll",
                        "stipend",
                        "part time",
                        "job",
                        "tutoring",
                        "tutor",
                        "wage"
                    ]
                ):

                    source = "Salary"


          
                elif any(
                    word in description_lower
                    for word in [
                        "freelance",
                        "contract",
                        "upwork",
                        "fiverr",
                        "client",
                        "project"
                    ]
                ):

                    source = "Freelance"


               
                elif any(
                    word in description_lower
                    for word in [
                        "business",
                        "sale",
                        "store",
                        "shop",
                        "revenue",
                        "profit",
                        "client payment",
                        "vendor"
                    ]
                ):

                    source = "Business"

                elif any(
                    word in description_lower
                    for word in [
                        "interest",
                        "bank interest",
                        "dividend",
                        "share",
                        "stock",
                        "return",
                        "capital gain"
                    ]
                ):

                    source = "Investment"


                elif any(
                    word in description_lower
                    for word in [
                        "from brother",
                        "from mother",
                        "from father",
                        "from dad",
                        "from mom",
                        "expense money",
                        "pocket money",
                        "allowance",
                        "gift"
                    ]
                ):

                    source = "Allowance"


                else:

                    source = "Other"


                cursor.execute(
                    """
                    INSERT INTO income
                    (
                        user_id,
                        amount,
                        note,
                        income_date,
                        source,
                        payment_method
                    )
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        current_user["user_id"],
                        amount,
                        description,
                        date,
                        source,
                        payment_method
                    )
                )


            elif transaction_type in [
                "expense",
                "withdraw"
            ]:

                description_lower = (
                    description.lower()
                )


                if any(
                    word in description_lower
                    for word in [
                        "food",
                        "restaurant",
                        "cafe",
                        "dining",
                        "grocery"
                    ]
                ):

                    category = "Food"


                elif any(
                    word in description_lower
                    for word in [
                        "movie",
                        "netflix",
                        "game",
                        "concert",
                        "entertainment"
                    ]
                ):

                    category = "Entertainment"


                elif any(
                    word in description_lower
                    for word in [
                        "bus",
                        "taxi",
                        "indrive",
                        "pathao",
                        "fuel",
                        "busfare",
                        "transportion"
                    ]
                ):

                    category = "Transportation"


                elif any(
                    word in description_lower
                    for word in [
                        "clothes",
                        "shopping",
                        "shoes",
                        "dress",
                        "daraz"
                    ]
                ):

                    category = "Shopping"


                
                elif any(
                    word in description_lower
                    for word in [
                        "doctor",
                        "hospital",
                        "medicine",
                        "health",
                        "checkup",
                        "fitness",
                        "gym",
                        "gym membership",
                        "workout"
                    ]
                ):

                    category = "Health"


                elif any(
                    word in description_lower
                    for word in [
                        "college",
                        "exam form",
                        "course",
                        "book",
                        "education",
                        "semester",
                        "college fee"
                    ]
                ):

                    category = "Education"


                else:

                    category = "Other"

                cursor.execute(
                    """
                    INSERT INTO expenses
                    (
                        user_id,
                        amount,
                        note,
                        expense_date,
                        category,
                        payment_method
                    )
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        current_user["user_id"],
                        amount,
                        description,
                        date,
                        category,
                        payment_method
                    )
                )


            else:

                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid transaction type: {transaction_type}"
                )


        conn.commit()

        return {
            "message": "CSV imported successfully",
            "rows_imported": len(df)
        }


    except HTTPException:
        conn.rollback()
        raise


    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )


    finally:

        close_connection(
            conn,
            cursor
        )