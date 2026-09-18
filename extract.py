import requests

def extrair_cotacao():
    url = "https://economia.awesomeapi.com.br/json/last/USD-BRL"
    resposta = requests.get(url)
    return resposta.json()