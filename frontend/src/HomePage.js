import React, { useEffect, useState } from "react";

function HomePage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/all_recipes")
      .then(r => r.json())
      .then(data => {
        setRecipes(data.results || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "2em auto",
        background: "#fff",
        borderRadius: "16px",
        boxShadow: "0 8px 32px rgba(50,50,90,0.08)",
        padding: "2em 2.5em"
      }}
    >
      <h1 style={{ textAlign: "center", color: "#4f46e5" }}>🍲 All Recipes</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {recipes.length === 0 && (
            <li style={{ color: "#6b7280", fontStyle: "italic" }}>
              No recipes found.
            </li>
          )}
          {recipes.map((recipe, idx) => (
            <li
              key={idx}
              style={{
                marginBottom: "2em",
                padding: "1.2em",
                background: "#f1f5f9",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(99,102,241,0.04)"
              }}
            >
              <div
                style={{
                  fontSize: "1.25em",
                  fontWeight: "bold",
                  marginBottom: "0.3em",
                  color: "#312e81"
                }}
              >
                {recipe.name}
              </div>
              <div style={{ marginBottom: "0.5em" }}>
                <span style={{ fontWeight: "bold" }}>Ingredients:</span>{" "}
                {recipe.ingredients.map(i =>
                  typeof i === "string"
                    ? i
                    : i.item
                ).join(", ")}
              </div>
              <div>
                <span style={{ fontWeight: "bold" }}>Instructions:</span>{" "}
                {recipe.instructions}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default HomePage;
