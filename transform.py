import pandas as pd
from datetime import datetime

def transformar(dados):
    cotacao = dados['USDBRL']
    df = pd.DataFrame([{
        'moeda': 'USD-BRL',
        'valor': float(cotacao['bid']),
        'data_coleta': datetime.now()
    }])
    return df