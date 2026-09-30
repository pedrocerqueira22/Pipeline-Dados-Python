import requests

def extrair_cotacao():
    moedas = "USD-BRL,EUR-BRL,GBP-BRL,JPY-BRL,ARS-BRL,CAD-BRL,AUD-BRL,CHF-BRL,CNY-BRL,BTC-BRL"
    url = f"https://economia.awesomeapi.com.br/json/last/{moedas}"
    resposta = requests.get(url)
    return resposta.json()