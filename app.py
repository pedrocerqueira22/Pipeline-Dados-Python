import streamlit as st
import sqlite3
import pandas as pd
import requests
from datetime import date
from extract import extrair_cotacao
from transform import transformar
from load import carregar

def buscar_cotacao_historica(moeda, data_escolhida):
    data_formatada = data_escolhida.strftime("%Y%m%d")
    url = f"https://economia.awesomeapi.com.br/json/daily/{moeda}/1?start_date={data_formatada}&end_date={data_formatada}"
    resposta = requests.get(url)
    dados = resposta.json()
    return dados

def buscar_historico_mensal(moeda, dias=365):
    url = f"https://economia.awesomeapi.com.br/json/daily/{moeda}/{dias}"
    resposta = requests.get(url)
    dados = resposta.json()
    df = pd.DataFrame(dados)
    df['valor'] = df['bid'].astype(float)
    df['data'] = pd.to_datetime(df['timestamp'].astype(int), unit='s')
    df['mes'] = df['data'].dt.to_period('M').astype(str)
    media_mensal = df.groupby('mes')['valor'].mean().reset_index()
    return media_mensal

st.set_page_config(page_title="Pipeline de Cotações", layout="centered")
st.title("💱 Pipeline de Cotações - Moedas")

if st.button("🔄 Atualizar cotações agora"):
    dados = extrair_cotacao()
    df_novo = transformar(dados)
    carregar(df_novo)
    st.success("Cotações atualizadas com sucesso!")

conn = sqlite3.connect('database.db')
historico = pd.read_sql("SELECT * FROM cotacoes ORDER BY data_coleta DESC", conn)
conn.close()

st.subheader("📊 Histórico de cotações")

moedas_disponiveis = historico['moeda'].unique()
moeda_selecionada = st.selectbox("Filtrar por moeda:", ["Todas"] + list(moedas_disponiveis))

if moeda_selecionada != "Todas":
    historico_filtrado = historico[historico['moeda'] == moeda_selecionada]
else:
    historico_filtrado = historico

st.dataframe(historico_filtrado)

if moeda_selecionada != "Todas":
    st.subheader("📈 Variação ao longo dos meses")
    codigo_moeda = moeda_selecionada
    with st.spinner("Buscando histórico mensal..."):
        try:
            historico_mensal = buscar_historico_mensal(codigo_moeda)
            st.line_chart(historico_mensal.set_index('mes')['valor'])
        except Exception as e:
            st.warning("Não foi possível carregar o histórico mensal dessa moeda no momento.")
else:
    st.info("Selecione uma moeda específica no filtro acima para ver a variação ao longo dos meses.")

st.divider()
st.subheader("🔎 Consultar cotação em uma data específica")

col1, col2 = st.columns(2)

with col1:
    moedas_para_consulta = {
        "Dólar (USD)": "USD-BRL",
        "Euro (EUR)": "EUR-BRL",
        "Libra (GBP)": "GBP-BRL",
        "Iene (JPY)": "JPY-BRL",
        "Bitcoin (BTC)": "BTC-BRL"
    }
    moeda_nome = st.selectbox("Escolha a moeda:", list(moedas_para_consulta.keys()))
    moeda_codigo = moedas_para_consulta[moeda_nome]

with col2:
    data_escolhida = st.date_input(
        "Escolha a data:",
        value=date(2024, 1, 15),
        max_value=date.today()
    )


if st.button("Buscar cotação histórica"):
    with st.spinner("Buscando dados..."):
        try:
            resultado = buscar_cotacao_historica(moeda_codigo, data_escolhida)
            if resultado:
                valor = float(resultado[0]['bid'])
                st.success(f"💰 {moeda_nome} em {data_escolhida.strftime('%d/%m/%Y')}: R$ {valor:.4f}")
            else:
                st.warning("Nenhum dado encontrado para essa data (pode ser fim de semana ou feriado, quando o mercado não opera).")
        except Exception as e:
            st.error("Não foi possível buscar essa cotação agora. Tente novamente em instantes.")