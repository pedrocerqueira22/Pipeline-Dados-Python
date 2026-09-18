from extract import extrair_cotacao
from transform import transformar
from load import carregar

def main():
    dados_brutos = extrair_cotacao()
    dados_tratados = transformar(dados_brutos)
    carregar(dados_tratados)
    print("Pipeline executado com sucesso!")

if __name__ == "__main__":
    main()