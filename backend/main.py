from dotenv import load_dotenv
from fastapi import FastAPI, Query
from pydantic import BaseModel
from typing import List
import openai
import pinecone
import os
from utils import get_recipe_embeddings, filter_recipes

app = FastAPI()

openai.api_key = os.getenv("OPENAI_API_KEY")
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pinecone.Index(os.getenv("PINECONE_INDEX"))

class RecipeQuery(BaseModel):
    ingredients: List[str]
    filter_type: str  # "strict", "flexible", "loose"
    allowed_extras: int = 0

@app.post("/recommend")
async def recommend_recipes(query: RecipeQuery):
    ingredient_query = ", ".join(query.ingredients)
    embedding = openai.embeddings.create(
        input=ingredient_query,
        model="text-embedding-ada-002"
    )["data"][0]["embedding"]

    result = pinecone_index.query(
        vector=embedding,
        top_k=30,
        include_metadata=True
    )
    recipes = [match['metadata'] for match in result['matches']]

    filtered = filter_recipes(
        recipes, 
        query.ingredients, 
        query.filter_type, 
        query.allowed_extras
    )

    return {"results": filtered}
