import sqlite3

def carregar(df):
    conn = sqlite3.connect('database.db')
    df.to_sql('cotacoes', conn, if_exists='append', index=False)
    conn.close()