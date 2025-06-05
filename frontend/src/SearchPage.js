import React, { useState, useEffect, useRef } from "react";

function SearchPage() {
  const [ingredients, setIngredients] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [filterType, setFilterType] = useState("strict");
  const [allowedExtras, setAllowedExtras] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef();

  useEffect(() => {
    if (ingredients.trim() === "") {
      setRecipes([]);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setRecipes([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const ingredientList = ingredients
        .split(/,|\s+/)
        .map((i) => i.trim())
        .filter(Boolean);

      fetch("http://localhost:8000/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: ingredientList,
          filter_type: filterType,
          allowed_extras: allowedExtras,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Backend error: " + response.status);
          }
          return response.json();
        })
        .then((data) => setRecipes(data.results || []))
        .catch((err) => setError(err.message || "Network error"))
        .finally(() => setLoading(false));
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [ingredients, filterType, allowedExtras]);

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
      <h1 style={{ textAlign: "center", color: "#4f46e5" }}>
        🍳 Recipe Recommender
      </h1>
      <form
        style={{ marginBottom: "2em" }}
        onSubmit={e => e.preventDefault()}
      >
        <label style={{ fontWeight: "bold" }}>
          Ingredients (comma or space separated):
          <input
            type="text"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            style={{
              width: "100%",
              marginTop: "0.5em",
              marginBottom: "1em",
              padding: "0.6em",
              borderRadius: "8px",
              border: "1px solid #c7d2fe",
            }}
            placeholder="e.g. eggs milk bread"
            autoFocus
            required
          />
        </label>
        <div style={{ marginBottom: "1em" }}>
          <label style={{ fontWeight: "bold" }}>
            Filter type:
            <div style={{ display: "flex", gap: 16, marginTop: "0.6em" }}>
              {["strict", "flexible", "loose"].map((ftype) => (
                <button
                  key={ftype}
                  type="button"
                  style={{
                    background:
                      filterType === ftype
                        ? "linear-gradient(90deg,#6366f1 0%,#818cf8 100%)"
                        : "#f1f5f9",
                    color: filterType === ftype ? "#fff" : "#4f46e5",
                    border: filterType === ftype
                      ? "none"
                      : "1px solid #c7d2fe",
                    borderRadius: "8px",
                    padding: "0.5em 1.5em",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onClick={() => setFilterType(ftype)}
                >
                  {ftype.charAt(0).toUpperCase() + ftype.slice(1)}
                </button>
              ))}
            </div>
          </label>
          {filterType === "flexible" && (
            <label style={{ marginLeft: "2em", fontWeight: "bold" }}>
              Allowed extra ingredients:
              <input
                type="number"
                min="0"
                max="5"
                value={allowedExtras}
                onChange={(e) => setAllowedExtras(Number(e.target.value))}
                style={{
                  width: "3em",
                  marginLeft: "0.5em",
                  padding: "0.2em",
                  borderRadius: "8px",
                  border: "1px solid #c7d2fe",
                }}
              />
            </label>
          )}
        </div>
      </form>
      {error && (
        <div
          style={{
            color: "#b91c1c",
            background: "#fee2e2",
            padding: "0.6em",
            borderRadius: "8px",
            marginBottom: "1.2em",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          {error}
        </div>
      )}
      <h2 style={{ color: "#4f46e5", borderBottom: "1px solid #e0e7ff" }}>
        Results
      </h2>
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {recipes.length === 0 && !loading && (
          <li style={{ color: "#6b7280", fontStyle: "italic" }}>
            No recipes found yet.
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
              boxShadow: "0 2px 8px rgba(99,102,241,0.04)",
            }}
          >
            <div
              style={{
                fontSize: "1.25em",
                fontWeight: "bold",
                marginBottom: "0.3em",
                color: "#312e81",
              }}
            >
              {recipe.name}
            </div>
            <div style={{ marginBottom: "0.5em" }}>
              <span style={{ fontWeight: "bold" }}>Ingredients:</span>{" "}
              {recipe.ingredients.join(", ")}
            </div>
            <div>
              <span style={{ fontWeight: "bold" }}>Instructions:</span>{" "}
              {recipe.instructions}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SearchPage;
