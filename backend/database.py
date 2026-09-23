import psycopg2


def get_connection():
    return psycopg2.connect(
        host="localhost",
        user="postgres",
        password="root",
        database="budgetmate",
        port="5432"
    )


def close_connection(conn, cursor=None):
    if cursor:
        cursor.close()
    if conn:
        conn.close()