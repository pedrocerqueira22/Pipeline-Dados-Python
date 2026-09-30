import pandas as pd
from datetime import datetime

def transformar(dados):
    linhas = []
    for chave, cotacao in dados.items():
        linhas.append({
            'moeda': cotacao['code'] + '-' + cotacao['codein'],
            'valor': float(cotacao['bid']),
            'data_coleta': datetime.now()
        })
    df = pd.DataFrame(linhas)
    return df