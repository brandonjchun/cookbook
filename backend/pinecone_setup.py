import pinecone
import openai
import os
import json

openai.api_key = os.getenv("OPENAI_API_KEY")
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX"))

with open('recipes.json') as f:
    recipes = json.load(f)

for i, r in enumerate(recipes):
    text = ", ".join(r["ingredients"]) + ". " + r["instructions"]
    embedding = openai.embeddings.create(
        input=text,
        model="text-embedding-ada-002"
    )["data"][0]["embedding"]
    index.upsert([(f"recipe-{i}", embedding, r)])

