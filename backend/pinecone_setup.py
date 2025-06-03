from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec
import openai
import os
import json

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = os.getenv("PINECONE_INDEX")  # This is the string name

# Only now check for index existence using the name
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,   # <-- Correct: use string name
        dimension=1536,
        metric="cosine",
        spec=ServerlessSpec(
            cloud='aws',
            region='us-east-1'
        )
    )

# Wait for index to be ready (important for new serverless index)
import time
while pc.describe_index(index_name).status['ready'] is not True:
    print("Waiting for index to be ready...")
    time.sleep(3)

# Now connect to the index (object)
index = pc.Index(index_name)

with open('recipes.json') as f:
    recipes = json.load(f)

for i, r in enumerate(recipes):
    text = ", ".join(r["ingredients"]) + ". " + r["instructions"]
    embedding = openai.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )["data"][0]["embedding"]
    index.upsert([(f"recipe-{i}", embedding, r)])

print("Upload complete.")
