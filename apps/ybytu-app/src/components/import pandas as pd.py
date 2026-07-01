import pandas as pd
import uuid

# 1. Carrega o seu arquivo CSV original
df = pd.read_csv("meal_plan.csv")

# 2. Cria uma nova coluna 'id' com UUIDs aleatórios para cada plano
df.insert(0, 'id', [str(uuid.uuid4()) for _ in range(len(df))])

# 3. Renomeia as colunas de texto para 'slug'
df.rename(columns={'meal_plan_id': 'slug', 'goal_ids': 'goal_slug'}, inplace=True)

# 4. Função mágica para converter a lista de refeições em Array do PostgreSQL
def formatar_array_postgres(texto):
    if pd.isna(texto):
        return "{}"
    # Tira os espaços e coloca entre chaves
    itens = [item.strip() for item in str(texto).split(',')]
    return "{" + ",".join(itens) + "}"

# Aplica a formatação na coluna de refeições
df['meal_ids'] = df['meal_ids'].apply(formatar_array_postgres)

# 5. Salva o novo arquivo pronto para o Supabase!
df.to_csv("meal_plan_pronto_pro_supabase.csv", index=False)

print("✅ Arquivo corrigido com sucesso! Procure por 'meal_plan_pronto_pro_supabase.csv'")