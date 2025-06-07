import React, { useState } from "react";

function AutoRecipePage() {
  const [ingredients, setIngredients] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult("");
    const ingredientList = ingredients
      .split(/,|\s+/) // allow both comma and space separated
      .map((i) => i.trim())
      .filter(Boolean);

    try {
      const response = await fetch("http://localhost:8000/ai_recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingredientList }),
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data.recipe);
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "2em auto",
        background: "#fff",
        borderRadius: "16px",
        boxShadow: "0 8px 32px rgba(50,50,90,0.08)",
        padding: "2em 2.5em",
      }}
    >
      <h1 style={{ textAlign: "center", color: "#4f46e5" }}>
        🤖 AI Recipe Generator
      </h1>
      <form onSubmit={handleGenerate} style={{ marginBottom: "2em" }}>
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
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "linear-gradient(90deg,#6366f1 0%,#818cf8 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "0.7em 2em",
            fontWeight: "bold",
            fontSize: "1em",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(99,102,241,0.07)",
            transition: "background 0.2s",
          }}
        >
          {loading ? "Generating..." : "Generate Recipe"}
        </button>
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
      {result && (
        <div
          style={{
            marginTop: "2em",
            background: "#f1f5f9",
            borderRadius: "12px",
            padding: "1.5em",
            fontFamily: "monospace",
            whiteSpace: "pre-line",
          }}
        >
          {result}
        </div>
      )}
    </div>
  );
}

export default AutoRecipePage;
