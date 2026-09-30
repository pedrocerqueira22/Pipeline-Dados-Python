import streamlit as st
import sqlite3
import pandas as pd
from extract import extrair_cotacao
from transform import transformar
from load import carregar

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

if len(historico_filtrado) > 1:
    st.subheader("📈 Variação ao longo do tempo")
    grafico = historico_filtrado.sort_values('data_coleta')
    st.line_chart(grafico.set_index('data_coleta')['valor'])