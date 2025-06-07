from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import numpy as np
from sentence_transformers import SentenceTransformer
import requests
import os
from dotenv import load_dotenv

load_dotenv()
print("Loaded HF_TOKEN:", os.getenv("HF_TOKEN"))
# Load recipes
with open("recipes.json", "r") as f:
    RECIPES = json.load(f)

# Load embedding model (free, local)
MODEL = SentenceTransformer("all-MiniLM-L6-v2")

# Precompute embeddings for all recipes
def compute_recipe_embedding(recipe):
    text = ", ".join(recipe["ingredients"]) + ". " + recipe["instructions"]
    return MODEL.encode(text)

RECIPE_EMBEDDINGS = np.vstack([compute_recipe_embedding(r) for r in RECIPES])

# FastAPI setup
app = FastAPI()

# Allow CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    ingredients: list[str]
    filter_type: str  # "strict", "flexible", or "loose"
    allowed_extras: int = 0

class AIRecipeRequest(BaseModel):
    ingredients: list[str]

@app.post("/ai_recipe")
def ai_recipe(request: AIRecipeRequest):
    HF_TOKEN = os.getenv("HF_TOKEN")
    API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta"
    prompt = (
        f"Invent a unique, creative recipe using ONLY these ingredients: {', '.join(request.ingredients)}.\n"
        "Format:\nName: ...\nIngredients: ...\nInstructions: ...\n"
        "Give realistic ingredient amounts and clear, numbered instructions."
    )

    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    resp = requests.post(API_URL, headers=headers, json={"inputs": prompt})
    try:
        result = resp.json()
    except Exception:
        return {"error": "Invalid response from Hugging Face."}

    # Typical format: [{'generated_text': "..."}]
    if isinstance(result, list) and result and "generated_text" in result[0]:
        return {"recipe": result[0]["generated_text"]}
    elif isinstance(result, dict) and "error" in result:
        return {"error": result["error"]}
    else:
        return {"error": "Unexpected response from Hugging Face."}
    
@app.post("/recommend")
def recommend(request: QueryRequest):
    # Build user input string and embed
    user_ingredients = [ing.strip() for ing in request.ingredients]
    input_text = ", ".join(user_ingredients)
    user_embedding = MODEL.encode(input_text)

    # Compute cosine similarity to all recipes
    sims = RECIPE_EMBEDDINGS @ user_embedding / (
        np.linalg.norm(RECIPE_EMBEDDINGS, axis=1) * np.linalg.norm(user_embedding) + 1e-10
    )

    # Filter based on chosen strategy
    results = []
    for i, recipe in enumerate(RECIPES):
        recipe_ingredients = [ing.lower() for ing in recipe["ingredients"]]
        # --- Strict: all and only user ingredients (allow only spices as extras)
        if request.filter_type == "strict":
            extra_ings = [ing for ing in recipe_ingredients if ing not in [i.lower() for i in user_ingredients]]
            allowed_spices = ["salt", 
                              "pepper", 
                              "oil", 
                              "sugar", 
                              "water", 
                              "vinegar", 
                              "spice", 
                              "herbs", 
                              "butter",
                              "cumin",
                              "flour",
                              "rice",
                              "pasta",
                              "panko",
                              "garlic powder",
                              "onion powder",
                              "oregano",
                              "thyme",
                              "basil",
                              "paprika",
                              "chili flakes"
                              "cayenne pepper",
                              "soy sauce"]
            non_spice_extras = [e for e in extra_ings if e not in allowed_spices]
            if non_spice_extras:
                continue
            if set(recipe_ingredients) != set([i.lower() for i in user_ingredients] + [e for e in extra_ings if e in allowed_spices]):
                continue
        # --- Flexible: allow some extra ingredients
        elif request.filter_type == "flexible":
            extra_ings = [ing for ing in recipe_ingredients if ing not in [i.lower() for i in user_ingredients]]
            if len(extra_ings) > request.allowed_extras:
                continue
        # --- Loose: only requires all user ingredients be present
        elif request.filter_type == "loose":
            if not all(i.lower() in recipe_ingredients for i in user_ingredients):
                continue
        # Add to results, store similarity for ranking
        results.append({"similarity": float(sims[i]), **recipe})

    # Return sorted by similarity (highest first)
    results = sorted(results, key=lambda x: -x["similarity"])[:10]  # Top 10
    return {"results": results}

@app.get("/all_recipes")
def get_all_recipes():
    """
    Returns all recipes as a list.
    For frontend display, flattens ingredients to a list of names (not objects).
    """
    # Check if ingredients are objects (for new-style recipes.json), otherwise just pass as-is
    def flatten_ings(ings):
        # If list of dicts, return item field, else return string
        if len(ings) > 0 and isinstance(ings[0], dict):
            return [i["item"] for i in ings]
        return ings

    results = []
    for recipe in RECIPES:
        results.append({
            "name": recipe["name"],
            "ingredients": flatten_ings(recipe["ingredients"]),
            "instructions": recipe.get("instructions", "")
        })
    return {"results": results}